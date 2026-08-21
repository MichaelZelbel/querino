// Finding C2: ensure-token-allowance took force_tokens straight from the body
// and granted that many tokens to the caller's own account. The admin check
// only fired when the body named somebody else, so granting yourself a billion
// credits was unguarded. period_start and period_end were equally open, which
// is also the route into finding M5's permanently broken account.

import { test, expect } from "@playwright/test";
import { asUser, callFunction, signInTestUser } from "./helpers/api";
import { activeAllowance } from "./helpers/fixtures";

const HUGE = 999_999_999;

async function postAsTestUser(body: Record<string, unknown>) {
  const session = await signInTestUser();
  return callFunction("ensure-token-allowance", body, asUser(session.accessToken));
}

test.describe("C2 — administrative overrides need an admin", () => {
  test("a non-admin cannot mint itself credits with force_tokens", async () => {
    const before = await activeAllowance();

    const res = await postAsTestUser({ force_tokens: HUGE });

    expect(res.status, "the request must be refused").toBeGreaterThanOrEqual(400);
    expect(res.body).toMatchObject({ success: false });
    expect(JSON.stringify(res.body)).toMatch(/admin/i);

    // The status code alone is not the point. What matters is that nothing
    // was granted, so assert the balance too.
    const after = await activeAllowance();
    expect(after.tokens_granted).toBe(before.tokens_granted);
    expect(after.tokens_granted).toBeLessThan(HUGE);
  });

  test("naming its own user_id does not turn force_tokens into a permitted option", async () => {
    const session = await signInTestUser();
    const before = await activeAllowance();

    const res = await postAsTestUser({ user_id: session.userId, force_tokens: HUGE });

    expect(res.status).toBeGreaterThanOrEqual(400);
    const after = await activeAllowance();
    expect(after.tokens_granted).toBe(before.tokens_granted);
  });

  test("a non-admin cannot choose its own period, which is how overlapping periods start", async () => {
    const before = await activeAllowance();

    const res = await postAsTestUser({
      period_start: "2000-01-01T00:00:00.000Z",
      period_end: "2099-01-01T00:00:00.000Z",
      source: "self_granted",
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.body)).toMatch(/admin/i);

    // activeAllowance() throws when more than one period is live, so this call
    // is itself the assertion that no second, overlapping period was created.
    const after = await activeAllowance();
    expect(after.id).toBe(before.id);
  });

  test("a non-admin cannot target another account", async () => {
    const res = await postAsTestUser({
      user_id: "00000000-0000-0000-0000-000000000001",
      // no privileged options, so this exercises the user_id check on its own
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.body)).toMatch(/admin/i);
  });

  test("an ordinary call with no overrides is still allowed", async () => {
    const res = await postAsTestUser({});
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });
});
