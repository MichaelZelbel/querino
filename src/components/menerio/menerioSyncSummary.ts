// How a bulk Menerio sync ended, in words. The old message counted every
// finished row, failed ones included, and the rows still queued when the
// ten-minute wait ran out, as "N artifacts synchronized".

export interface SyncRunSummary {
  synced: number;
  failed: number;
  pending: number;
}

/** Tally the status of each queue row this run created. */
export function summariseSyncRun(
  statuses: ReadonlyArray<string | null | undefined>,
  expected: number,
): SyncRunSummary {
  const synced = statuses.filter((s) => s === "completed").length;
  const failed = statuses.filter((s) => s === "failed").length;
  // A row that never came back from the poll is still outstanding.
  const pending = Math.max(0, expected - synced - failed);
  return { synced, failed, pending };
}

/** The toast after a run: success only when every row was synced. */
export function syncRunMessage(summary: SyncRunSummary): {
  ok: boolean;
  text: string;
} {
  const { synced, failed, pending } = summary;
  const n = (k: number) => `${k} artifact${k === 1 ? "" : "s"}`;
  if (failed === 0 && pending === 0) {
    return { ok: true, text: `Sync complete. ${n(synced)} synchronized.` };
  }
  const parts = [`${n(synced)} synchronized`];
  if (failed > 0) parts.push(`${failed} failed`);
  if (pending > 0) parts.push(`${pending} still waiting in the queue`);
  return { ok: false, text: `Sync finished: ${parts.join(", ")}.` };
}
