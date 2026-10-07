import { assertEquals } from "@std/assert";
import {
  summariseSyncRun,
  syncRunMessage,
} from "@/components/menerio/menerioSyncSummary.ts";

const done = { status: "completed", error_message: null };

Deno.test("failed rows are not reported as synchronized", () => {
  const s = summariseSyncRun([done, { status: "failed" }, done], 3);
  assertEquals(s, {
    synced: 2,
    skipped: 0,
    failed: 1,
    pending: 0,
    skipReasons: [],
  });
  assertEquals(syncRunMessage(s), {
    ok: false,
    text: "Sync finished: 2 artifacts synchronized, 1 failed.",
  });
});

Deno.test("rows still queued when the wait ends are named as waiting", () => {
  const s = summariseSyncRun(
    [done, { status: "pending" }, { status: "processing" }],
    4,
  );
  assertEquals(s.synced, 1);
  assertEquals(s.pending, 3);
  assertEquals(
    syncRunMessage(s).text,
    "Sync finished: 1 artifact synchronized, 3 still waiting in the queue.",
  );
});

Deno.test("a clean run is a success", () => {
  assertEquals(syncRunMessage(summariseSyncRun([done], 1)), {
    ok: true,
    text: "Sync complete. 1 artifact synchronized.",
  });
});

Deno.test("rows the worker skipped are skipped, not synchronized", () => {
  // 2026-10-07: the worker marks a row it did not send "completed" with an
  // error_message starting "skipped:", and the toast counted those as sent.
  const notInList = {
    status: "completed",
    error_message: "skipped: artifact type not in sync list",
  };
  const s = summariseSyncRun(
    [
      done,
      notInList,
      notInList,
      { status: "completed", error_message: "skipped: no active integration" },
    ],
    4,
  );
  assertEquals(s.synced, 1);
  assertEquals(s.skipped, 3);
  assertEquals(s.pending, 0);
  assertEquals(syncRunMessage(s), {
    ok: false,
    text: "Sync finished: 1 artifact synchronized, 3 skipped (artifact type not in sync list; no active integration).",
  });
});
