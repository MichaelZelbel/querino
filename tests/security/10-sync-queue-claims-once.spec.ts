// Finding M4: overlapping cron ticks double-sent Menerio syncs.
//
// process-menerio-sync-queue used to SELECT ten pending rows and then, in a
// separate statement, UPDATE them to 'processing'. The job runs on a fixed schedule,
// so a slow tick left a gap in which the next tick selected the same rows and
// pushed the same artifact to the user's Menerio host a second time.
//
// claim_menerio_sync_queue does both in one statement under FOR UPDATE SKIP
// LOCKED. The test that matters is the concurrent one: two claims fired at the
// same instant must not both come back holding the same row.
//
// Every claim here runs inside a rolled-back SQL probe, and that probe first
// makes every row it did not create unclaimable for its own transaction. Until
// 2026-10-07 this file called the claim over REST with a batch of ten, five
// times a run, and the claim takes the OLDEST claimable rows of ANY user: a
// real user's queued sync caught that way sat in 'processing', was retried as
// a stale claim, and was given up on after five. Now a claim can only ever see
// the test's own rows, and even those are put back when the probe rolls back.
//
// The price is that the claim tests need SUPABASE_ACCESS_TOKEN (sqlProbe) and
// skip in CI, like the other probes. The refusal of a non-service caller still
// runs everywhere.

import { test, expect } from "@playwright/test";
import {
  hasManagementToken,
  restAsService,
  restAsUser,
  signInTestUser,
  sqlProbe,
} from "./helpers/api";

const NEEDS_TOKEN = "needs SUPABASE_ACCESS_TOKEN; skipped in CI on purpose";

const CLAIMABLE = `('pending', 'delete_pending', 'failed', 'delete_failed', 'processing', 'delete_processing')`;

/** How long each concurrent probe keeps its claim, so the other one meets it. */
const HOLD_SECONDS = 4;

const queued: string[] = [];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function testUserId(): Promise<string> {
  const { userId } = await signInTestUser();
  // It goes into SQL text below; it is our own account's id, but check anyway.
  if (!UUID.test(userId)) throw new Error(`unexpected user id ${userId}`);
  return userId;
}

/**
 * The statement every probe runs first: every claimable row that is not the
 * test's own becomes 'completed' for this transaction only. SKIP LOCKED, so a
 * row held by the live worker or by the other probe is left alone here, and
 * the claim skips it for the same reason. Nothing ever waits on anything.
 */
function hideEveryoneElse(mine: string): string {
  return `
        UPDATE public.menerio_sync_queue SET status = 'completed'
         WHERE id IN (
           SELECT q.id FROM public.menerio_sync_queue q
            WHERE q.status IN ${CLAIMABLE}
              AND q.id <> ALL(${mine})
            FOR UPDATE SKIP LOCKED);`;
}

/** Rows queued for real, so two probes in two sessions can both see them. */
async function queueRows(count: number): Promise<string[]> {
  const userId = await testUserId();
  const rows = Array.from({ length: count }, () => ({
    user_id: userId,
    artifact_type: "prompt",
    // A UUID that owns no artifact. If anything ever does process one of these
    // it fails on "Artifact not found" rather than sending something real.
    artifact_id: crypto.randomUUID(),
    status: "pending",
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

interface HeldClaim {
  ids: string[];
  /** When the claim returned, by the database's clock. */
  claimedAt: number;
  /** When the probe gave its rows back, at the earliest. */
  releasedAfter: number;
}

/** One claim in its own transaction, held for HOLD_SECONDS, then rolled back. */
async function claimAndHold(mine: string[]): Promise<HeldClaim> {
  const minesql = `ARRAY[${mine.map((id) => `'${id}'`).join(",")}]::uuid[]`;
  const out = await sqlProbe(`
      DO $probe$
      DECLARE
        claimed text;
        t_claimed timestamptz;
      BEGIN
        ${hideEveryoneElse(minesql)}
        SELECT coalesce(string_agg(c.id::text, ','), '') INTO claimed
          FROM public.claim_menerio_sync_queue(10) c;
        t_claimed := clock_timestamp();
        PERFORM pg_sleep(${HOLD_SECONDS});
        RAISE EXCEPTION 'PROBE OK claimed=[%] at=[%] released=[%]',
          claimed, extract(epoch FROM t_claimed), extract(epoch FROM clock_timestamp());
      END $probe$;
    `);
  const m =
    /PROBE OK claimed=\[([^\]]*)\] at=\[([\d.]+)\] released=\[([\d.]+)\]/.exec(
      out,
    );
  if (!m) throw new Error(`the claim probe did not report: ${out}`);
  return {
    ids: m[1] ? m[1].split(",") : [],
    claimedAt: Number(m[2]),
    releasedAfter: Number(m[3]),
  };
}

test.afterAll(async () => {
  for (const id of queued) {
    await restAsService(`menerio_sync_queue?id=eq.${id}`, { method: "DELETE" });
  }
});

test.describe("M4 — a queued sync is claimed once, never twice", () => {
  test("two claims fired at the same instant never hold the same row", async () => {
    test.skip(!hasManagementToken(), NEEDS_TOKEN);
    test.setTimeout(90_000);

    // Each round: six rows of our own, and two probes in two database sessions
    // that both want them. A round only counts when each claim happened while
    // the other probe still held what it took; a claim that ran after the
    // other had rolled back may rightly take the same rows again, so it proves
    // nothing either way and the round is repeated.
    for (let round = 1; round <= 3; round++) {
      const mine = await queueRows(6);
      const [a, b] = await Promise.all([
        claimAndHold(mine),
        claimAndHold(mine),
      ]);

      const overlapped =
        a.claimedAt < b.releasedAfter && b.claimedAt < a.releasedAfter;
      // Between them the probes should have taken the rows just queued, unless
      // the live worker beat them to all of them. Our rows carry no artifact
      // and the test account has no Menerio link, so that sends nothing.
      const idsA = a.ids.filter((id) => mine.includes(id));
      const idsB = b.ids.filter((id) => mine.includes(id));
      if (!overlapped || idsA.length + idsB.length === 0) continue;

      const both = idsA.filter((id) => idsB.includes(id));
      expect(
        both,
        "the same queue row was handed to two concurrent claims, so Menerio would receive it twice",
      ).toEqual([]);
      return;
    }
    throw new Error(
      "In three rounds the two claims never ran at the same time with a row of ours between " +
        "them, so concurrency was not tested. The Management API may have queued the two " +
        "probes, or the live worker took every row first.",
    );
  });

  test("a claimed row is not offered again", async () => {
    test.skip(!hasManagementToken(), NEEDS_TOKEN);
    const userId = await testUserId();

    // The rows are inserted inside the probe, so no other session ever sees
    // them, and they vanish with the rollback.
    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        mine uuid[];
        first_ids uuid[];
        second_ids uuid[];
        unchanged int;
      BEGIN
        ${hideEveryoneElse("'{}'::uuid[]")}
        WITH ins AS (
          INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
          SELECT '${userId}'::uuid, 'prompt', gen_random_uuid(), 'pending'
            FROM generate_series(1, 2)
          RETURNING id)
        SELECT array_agg(ins.id) INTO mine FROM ins;

        SELECT coalesce(array_agg(c.id), '{}') INTO first_ids
          FROM public.claim_menerio_sync_queue(10) c;
        SELECT coalesce(array_agg(c.id), '{}') INTO second_ids
          FROM public.claim_menerio_sync_queue(10) c;

        IF NOT (mine <@ first_ids) THEN
          RAISE EXCEPTION 'PROBE FAILED the first claim did not take the queued rows: %', first_ids;
        END IF;
        IF second_ids && mine THEN
          RAISE EXCEPTION 'PROBE FAILED a row was still claimable after being claimed';
        END IF;
        SELECT count(*) INTO unchanged FROM public.menerio_sync_queue
         WHERE id = ANY(mine) AND status <> 'processing';
        IF unchanged > 0 THEN
          RAISE EXCEPTION 'PROBE FAILED % claimed row(s) were hidden rather than moved to processing', unchanged;
        END IF;
        RAISE EXCEPTION 'PROBE OK claimed once, then not offered again';
      END $probe$;
    `);
    expect(out, out).toContain("PROBE OK");
  });

  test("a delete stays a delete when it is claimed", async () => {
    test.skip(!hasManagementToken(), NEEDS_TOKEN);
    const userId = await testUserId();

    const out = await sqlProbe(`
      DO $probe$
      DECLARE
        mine uuid;
        handed text;
        stored text;
      BEGIN
        ${hideEveryoneElse("'{}'::uuid[]")}
        INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
        VALUES ('${userId}'::uuid, 'prompt', gen_random_uuid(), 'delete_pending')
        RETURNING id INTO mine;

        SELECT c.status INTO handed
          FROM public.claim_menerio_sync_queue(10) c WHERE c.id = mine;
        SELECT q.status INTO stored FROM public.menerio_sync_queue q WHERE q.id = mine;

        IF handed IS NULL THEN
          RAISE EXCEPTION 'PROBE FAILED the queued delete was not claimed';
        END IF;
        IF handed <> 'delete_pending' OR stored <> 'delete_processing' THEN
          RAISE EXCEPTION 'PROBE FAILED a queued delete came back as % and was stored as %', handed, stored;
        END IF;
        RAISE EXCEPTION 'PROBE OK handed back as %, stored as %', handed, stored;
      END $probe$;
    `);
    expect(
      out,
      `a queued delete came back as a sync, so it would be re-uploaded instead of removed: ${out}`,
    ).toContain("PROBE OK");
  });

  test("only the service role may claim the queue", async () => {
    // A batch of zero, so that even if the refusal were ever broken this call
    // would claim nobody's row; the status still says whether it was refused.
    // It runs in CI.
    const res = await restAsUser("rpc/claim_menerio_sync_queue", {
      method: "POST",
      body: { batch_size: 0 },
    });
    expect(
      res.status,
      "a logged-in user could claim other people's queue rows",
    ).toBe(403);
  });
});
