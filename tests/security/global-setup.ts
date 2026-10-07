// Takes the one-row lock in public.security_suite_lock before the suite runs,
// and returns the function that gives it back (Playwright runs a function
// returned from globalSetup as the global teardown).
//
// Why: the suite shares one live test account and promotes it to admin for a
// moment in specs 08, 20 and 21. Two runs at once (a local run and the CI run
// the same push started) read each other's half-finished state. On 2026-09-23
// that left the live Prompt Coach on a fake model, and later wrote role =
// 'admin' onto the test profile. See migration 20260923150000.

import { hostname } from "node:os";
import { restAsService } from "./helpers/api";

const WAIT_LIMIT_MS = 15 * 60_000;
const POLL_MS = 15_000;
const STALE_AFTER_MS = 20 * 60_000;
/** A free lock that refuses us this many times in a row is not contention. */
const FREE_BUT_REFUSED_LIMIT = 4;

interface LockRow {
  holder: string;
  acquired_at: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function globalSetup(): Promise<() => Promise<void>> {
  const holder = process.env.GITHUB_RUN_ID
    ? `ci-run-${process.env.GITHUB_RUN_ID}`
    : `${hostname()}-${process.pid}-${Date.now()}`;
  const started = Date.now();
  let freeButRefused = 0;

  for (;;) {
    // An abandoned lock (a run that was killed) must not block for ever.
    const staleBefore = new Date(Date.now() - STALE_AFTER_MS).toISOString();
    await restAsService(
      `security_suite_lock?acquired_at=lt.${encodeURIComponent(staleBefore)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );

    const res = await restAsService("security_suite_lock", {
      method: "POST",
      body: { id: 1, holder },
      headers: { Prefer: "return=minimal" },
    });
    if (res.ok) break;

    const current = await restAsService<LockRow[]>(
      "security_suite_lock?select=holder,acquired_at",
    );
    if (!current.ok) {
      throw new Error(
        `Could not read the security suite lock: ${JSON.stringify(current.error ?? res.error)}. ` +
          "Is migration 20260923150000 applied?",
      );
    }
    const row = current.data?.[0];

    // Our own insert, answered too late. wireFetch retries a request whose
    // answer stalls, and when the first POST had already committed, the retry
    // is refused as a duplicate of it. Until 2026-10-07 that run then waited
    // the full 15 minutes on itself and gave up still holding the lock, so
    // every run after it waited too until the lock went stale.
    if (row?.holder === holder) break;

    if (Date.now() - started > WAIT_LIMIT_MS) {
      throw new Error(
        row
          ? `Another run of the security suite (${row.holder}) has held the lock since ${row.acquired_at}. ` +
              "Two runs at once corrupt each other's results, so this one stops."
          : `The security suite lock stayed free for 15 minutes but could not be taken: ${JSON.stringify(res.error)}`,
      );
    }

    if (!row) {
      // Free when we looked. Either another run took it and gave it back
      // between our two calls, which is worth one more try, or the insert
      // failed for a reason that is not contention at all (a changed table,
      // a refused key), which retrying cannot fix. Until 2026-10-07 this
      // branch retried at once and for ever, with no pause and no limit.
      freeButRefused++;
      if (freeButRefused >= FREE_BUT_REFUSED_LIMIT) {
        throw new Error(
          `The security suite lock is free, but taking it was refused ${freeButRefused} times ` +
            `(${res.status}: ${JSON.stringify(res.error)}). That is not another run holding it.`,
        );
      }
      await sleep(1_000 * 2 ** freeButRefused);
      continue;
    }
    freeButRefused = 0;

    console.log(
      `[security suite] waiting: ${row.holder} is running (since ${row.acquired_at})`,
    );
    await sleep(POLL_MS);
  }

  return async () => {
    const released = await restAsService(
      `security_suite_lock?holder=eq.${encodeURIComponent(holder)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );
    if (!released.ok) {
      console.warn(
        `[security suite] could not release the lock (${released.status}: ${JSON.stringify(released.error)}). ` +
          `The next run waits until it is ${STALE_AFTER_MS / 60_000} minutes old.`,
      );
    }
  };
}
