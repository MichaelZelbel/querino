import { assertEquals } from "@std/assert";
import {
  summariseSyncRun,
  syncRunMessage,
} from "@/components/menerio/menerioSyncSummary.ts";

Deno.test("failed rows are not reported as synchronized", () => {
  const s = summariseSyncRun(["completed", "failed", "completed"], 3);
  assertEquals(s, { synced: 2, failed: 1, pending: 0 });
  assertEquals(syncRunMessage(s), {
    ok: false,
    text: "Sync finished: 2 artifacts synchronized, 1 failed.",
  });
});

Deno.test("rows still queued when the wait ends are named as waiting", () => {
  const s = summariseSyncRun(["completed", "pending", "processing"], 4);
  assertEquals(s, { synced: 1, failed: 0, pending: 3 });
  assertEquals(
    syncRunMessage(s).text,
    "Sync finished: 1 artifact synchronized, 3 still waiting in the queue.",
  );
});

Deno.test("a clean run is a success", () => {
  assertEquals(syncRunMessage(summariseSyncRun(["completed"], 1)), {
    ok: true,
    text: "Sync complete. 1 artifact synchronized.",
  });
});
