// A hole this audit made itself, on 21 August, and the test that stops it
// coming back.
//
// v_ai_allowance_current was created in January WITH (security_invoker = on),
// so it read ai_allowance_periods as the caller and row-level security decided
// what came back. The Phase 2 migration rewrote it with a plain
// CREATE OR REPLACE VIEW ... AS to add DISTINCT ON, and CREATE OR REPLACE VIEW
// resets any option the new statement does not name. The view went back to
// running as its owner, postgres, which RLS does not apply to.
//
// For about an hour, one GET to /rest/v1/v_ai_allowance_current with the public
// anon key returned every user's id, token grant and remaining balance. That is
// finding C1 of this very audit, reintroduced by the fix for a different one.
//
// Test 14 asserts the mechanism (every view sets security_invoker) from the
// catalogue. This asserts the consequence, over HTTP, as the three callers who
// matter. Both are here because the mechanism could be satisfied by a view that
// leaks some other way, and the consequence could be hidden by an empty table.

import { test, expect } from "@playwright/test";
import { ANON_KEY, REST_URL } from "./helpers/env";
import { restAsService, restAsUser, signInTestUser } from "./helpers/api";

interface AllowanceRow {
  user_id: string;
  tokens_granted?: number;
  remaining_tokens?: number;
}

test.describe("The allowance view answers each caller with their own row", () => {
  test("there is more than one account, so the checks below can fail", async () => {
    const res = await restAsService<AllowanceRow[]>("v_ai_allowance_current?select=user_id");
    expect(res.ok, `the service role cannot read the view: ${JSON.stringify(res.error)}`).toBe(true);
    const users = new Set((res.data ?? []).map((r) => r.user_id));
    expect(
      users.size,
      "fewer than two accounts have a current period, so a leak would look like a non-leak",
    ).toBeGreaterThan(1);
  });

  test("a stranger holding the anon key gets nothing", async () => {
    const res = await fetch(
      `${REST_URL}/v_ai_allowance_current?select=user_id,tokens_granted,remaining_tokens`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    const body = await res.json();
    const rows = Array.isArray(body) ? (body as AllowanceRow[]) : [];

    expect(
      rows.length,
      "the anon key, which ships in every visitor's browser bundle, is reading other people's " +
        "credit balances. The view has lost security_invoker.",
    ).toBe(0);
  });

  test("a logged-in user gets exactly their own row", async () => {
    const { userId } = await signInTestUser();
    const res = await restAsUser<AllowanceRow[]>(
      "v_ai_allowance_current?select=user_id,tokens_granted,remaining_tokens",
    );
    expect(res.ok, `reading the view failed: ${JSON.stringify(res.error)}`).toBe(true);

    const others = (res.data ?? []).filter((r) => r.user_id !== userId);
    expect(
      others.map((r) => r.user_id),
      "a logged-in user is reading other people's credit balances",
    ).toEqual([]);
    expect((res.data ?? []).length, "the caller cannot see their own balance either").toBe(1);
  });

  test("the service role still sees everyone, because llm.ts depends on it", async () => {
    // The credit gate reads this view with the service role for whichever user
    // it is about. Locking the view down must not lock that out.
    const res = await restAsService<AllowanceRow[]>("v_ai_allowance_current?select=user_id");
    expect((res.data ?? []).length).toBeGreaterThan(1);
  });

  test("the base table is not readable either, by either route", async () => {
    const direct = await fetch(`${REST_URL}/ai_allowance_periods?select=user_id,tokens_granted`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    const rows = await direct.json();
    expect(
      Array.isArray(rows) ? rows.length : 0,
      "the allowance table itself is readable with the anon key",
    ).toBe(0);
  });
});
