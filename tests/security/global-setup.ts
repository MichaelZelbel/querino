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

interface LockRow {
  holder: string;
  acquired_at: string;
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  const holder = process.env.GITHUB_RUN_ID
    ? `ci-run-${process.env.GITHUB_RUN_ID}`
    : `${hostname()}-${process.pid}-${Date.now()}`;
  const started = Date.now();

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
    const row = current.data?.[0];
    if (!row && !res.ok && current.ok) {
      // Taken and released between the two calls; try again at once.
      continue;
    }
    if (!current.ok) {
      throw new Error(
        `Could not read the security suite lock: ${JSON.stringify(current.error ?? res.error)}. ` +
          "Is migration 20260923150000 applied?",
      );
    }
    if (Date.now() - started > WAIT_LIMIT_MS) {
      throw new Error(
        `Another run of the security suite (${row?.holder}) has held the lock since ${row?.acquired_at}. ` +
          "Two runs at once corrupt each other's results, so this one stops.",
      );
    }
    console.log(
      `[security suite] waiting: ${row?.holder} is running (since ${row?.acquired_at})`,
    );
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  return async () => {
    await restAsService(
      `security_suite_lock?holder=eq.${encodeURIComponent(holder)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );
  };
}
