// The credit gate, from the outside. An account with nothing left must be told
// so, cleanly, before any paid call is made — not after one.
//
// refine-prompt is the endpoint under test because it checks credits at step 3
// and only reaches the AI gateway at step 5, so running this test costs
// nothing. The suite puts the test account's balance back afterwards.
//
// Phase 2 rewrites the credit path. This test is the reason to write it first.

import { test, expect } from "@playwright/test";
import { asAnonymous, asUser, callFunction, signInTestUser } from "./helpers/api";
import { activeAllowance, withExhaustedCredits } from "./helpers/fixtures";

const REFINE_BODY = { prompt: "write a haiku about idempotency", framework: "auto" };

test.describe("The credit gate", () => {
  test("an account with credits left is served", async () => {
    const session = await signInTestUser();
    const allowance = await activeAllowance();
    expect(
      allowance.tokens_granted - allowance.tokens_used,
      "the test account starts with credits to spend",
    ).toBeGreaterThan(0);

    // Only the gate is under test here, so stop at "not 402" rather than
    // spending gateway money on a full round trip.
    const res = await callFunction("refine-prompt", { prompt: "" }, asUser(session.accessToken));
    expect(res.status, "an empty prompt is a 400, which proves the gate let us past auth").toBe(400);
  });

  test("an account with nothing left gets 402, not a paid call", async () => {
    const session = await signInTestUser();

    await withExhaustedCredits(async () => {
      const res = await callFunction("refine-prompt", REFINE_BODY, asUser(session.accessToken));

      expect(res.status).toBe(402);
      expect(JSON.stringify(res.body)).toMatch(/credit/i);
    });
  });

  test("the balance is restored after the exhausted-credits test", async () => {
    const allowance = await activeAllowance();
    expect(allowance.tokens_granted - allowance.tokens_used).toBeGreaterThan(0);
  });

  test("an unauthenticated caller never reaches the gate at all", async () => {
    const res = await callFunction("refine-prompt", REFINE_BODY, asAnonymous);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).not.toBe(200);
  });
});
