// How a bulk Menerio sync ended, in words. The old message counted every
// finished row, failed ones included, and the rows still queued when the
// ten-minute wait ran out, as "N artifacts synchronized".
//
// Since 2026-10-07 a row the worker finished without sending anything is
// counted as skipped. The worker marks such a row `completed` with an
// error_message that starts with "skipped:" (no active integration, the type
// is not in the sync list, the artifact was deleted), and those were reported
// as synchronized although nothing reached Menerio.

export interface SyncQueueRowState {
  status: string | null | undefined;
  error_message?: string | null;
}

export interface SyncRunSummary {
  synced: number;
  skipped: number;
  failed: number;
  pending: number;
  /** The distinct reasons the worker gave for skipping, without "skipped:". */
  skipReasons: string[];
}

const SKIP_PREFIX = "skipped:";

export function isSkippedRow(row: SyncQueueRowState): boolean {
  return (
    row.status === "completed" &&
    typeof row.error_message === "string" &&
    row.error_message.trim().toLowerCase().startsWith(SKIP_PREFIX)
  );
}

/** Tally the queue rows this run created. */
export function summariseSyncRun(
  rows: ReadonlyArray<SyncQueueRowState>,
  expected: number,
): SyncRunSummary {
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  const reasons = new Set<string>();
  for (const row of rows) {
    if (isSkippedRow(row)) {
      skipped++;
      const reason = row.error_message!.trim().slice(SKIP_PREFIX.length).trim();
      if (reason) reasons.add(reason);
    } else if (row.status === "completed") {
      synced++;
    } else if (row.status === "failed" || row.status === "delete_failed") {
      failed++;
    }
  }
  // A row that never came back from the poll is still outstanding.
  const pending = Math.max(0, expected - synced - skipped - failed);
  return { synced, skipped, failed, pending, skipReasons: [...reasons] };
}

/** The toast after a run: success only when every row was really sent. */
export function syncRunMessage(summary: SyncRunSummary): {
  ok: boolean;
  text: string;
} {
  const { synced, skipped, failed, pending, skipReasons } = summary;
  const n = (k: number) => `${k} artifact${k === 1 ? "" : "s"}`;
  if (failed === 0 && pending === 0 && skipped === 0) {
    return { ok: true, text: `Sync complete. ${n(synced)} synchronized.` };
  }
  const parts = [`${n(synced)} synchronized`];
  if (skipped > 0) {
    parts.push(
      skipReasons.length > 0
        ? `${skipped} skipped (${skipReasons.join("; ")})`
        : `${skipped} skipped`,
    );
  }
  if (failed > 0) parts.push(`${failed} failed`);
  if (pending > 0) parts.push(`${pending} still waiting in the queue`);
  return { ok: false, text: `Sync finished: ${parts.join(", ")}.` };
}
