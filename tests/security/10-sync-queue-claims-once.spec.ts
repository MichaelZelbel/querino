// Finding M4: overlapping cron ticks double-sent Menerio syncs.
//
// process-menerio-sync-queue used to SELECT ten pending rows and then, in a
// separate statement, UPDATE them to 'processing'. The job runs every minute,
// so a slow tick left a gap in which the next tick selected the same rows and
// pushed the same artifact to the user's Menerio host a second time.
//
// claim_menerio_sync_queue does both in one statement under FOR UPDATE SKIP
// LOCKED. The test that matters is the concurrent one: two claims fired at the
// same instant must not both come back holding the same row.
//
// The rows are queued for the test account, which has no Menerio integration,
// so if the live worker picks one up first it records "skipped: no active
// auto-sync integration" and nothing leaves the project.

import { test, expect } from "@playwright/test";
import { restAsService, restAsUser, signInTestUser } from "./helpers/api";

interface ClaimedRow {
  id: string;
  user_id: string;
  artifact_type: string;
  artifact_id: string;
  status: string;
  created_at: string;
}

const queued: string[] = [];

async function queueRows(count: number, status = "pending"): Promise<string[]> {
  const { userId } = await signInTestUser();
  const rows = Array.from({ length: count }, () => ({
    user_id: userId,
    artifact_type: "prompt",
    // A UUID that owns no artifact. If anything ever does process one of these
    // it fails on "Artifact not found" rather than sending something real.
    artifact_id: crypto.randomUUID(),
    status,
  }));
  const res = await restAsService<Array<{ id: string }>>("menerio_sync_queue", {
    method: "POST",
    body: rows,
    headers: { Prefer: "return=representation" },
  });
  if (!res.ok) throw new Error(`Queueing failed: ${JSON.stringify(res.error)}`);
  const ids = res.data!.map((r) => r.id);
  queued.push(...ids);
  return ids;
}

async function claim(batchSize: number): Promise<ClaimedRow[]> {
  const res = await restAsService<ClaimedRow[]>("rpc/claim_menerio_sync_queue", {
    method: "POST",
    body: { batch_size: batchSize },
  });
  if (!res.ok) throw new Error(`Claiming failed: ${JSON.stringify(res.error)}`);
  return res.data ?? [];
}

test.afterAll(async () => {
  for (const id of queued) {
    await restAsService(`menerio_sync_queue?id=eq.${id}`, { method: "DELETE" });
  }
});

test.describe("M4 — a queued sync is claimed once, never twice", () => {
  test("two claims fired at the same instant never hold the same row", async () => {
    const mine = await queueRows(6);

    const [a, b] = await Promise.all([claim(10), claim(10)]);

    const idsA = a.map((r) => r.id);
    const idsB = b.map((r) => r.id);
    const both = idsA.filter((id) => idsB.includes(id));

    expect(
      both,
      "the same queue row was handed to two concurrent claims, so Menerio would receive it twice",
    ).toEqual([]);

    // Between them the two calls should have taken the rows just queued, unless
    // the live worker beat them to some. Either way none may be claimed twice.
    const claimedMine = [...idsA, ...idsB].filter((id) => mine.includes(id));
    expect(new Set(claimedMine).size).toBe(claimedMine.length);
  });

  test("a claimed row is not offered again", async () => {
    const mine = await queueRows(2);
    const first = await claim(10);
    const second = await claim(10);

    const takenTwice = first.map((r) => r.id).filter((id) => second.some((r) => r.id === id));
    expect(takenTwice, "a row was still claimable after being claimed").toEqual([]);

    // And the rows really did change state rather than merely being hidden.
    const res = await restAsService<Array<{ id: string; status: string; claimed_at: string | null }>>(
      `menerio_sync_queue?id=in.(${mine.join(",")})&select=id,status,claimed_at`,
    );
    for (const row of res.data ?? []) {
      expect(
        ["processing", "delete_processing", "completed", "failed"],
        `row ${row.id} is still ${row.status} after being claimed`,
      ).toContain(row.status);
    }
  });

  test("a delete stays a delete when it is claimed", async () => {
    const mine = await queueRows(1, "delete_pending");
    const claimed = await claim(10);
    const row = claimed.find((r) => mine.includes(r.id));
    // The live worker may have taken it first; that is fine, it is the mapping
    // that is under test and only a row we actually see can testify to it.
    test.skip(!row, "the live worker claimed the row first");
    expect(
      row!.status,
      "a queued delete came back as a sync, so it would be re-uploaded instead of removed",
    ).toBe("delete_pending");
  });

  test("only the service role may claim the queue", async () => {
    const res = await restAsUser("rpc/claim_menerio_sync_queue", {
      method: "POST",
      body: { batch_size: 10 },
    });
    expect(
      res.status,
      "a logged-in user could claim other people's queue rows",
    ).toBe(403);
  });
});
