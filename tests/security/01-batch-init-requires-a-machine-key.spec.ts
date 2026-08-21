// Finding C1: ensure-token-allowance dispatched on {"batch_init": true} before
// it checked who was calling, and answered with every user's id and allowance
// row. One unauthenticated POST was the whole user list.

import { test, expect } from "@playwright/test";
import {
  asAnonKey,
  asAnonymous,
  asInternalKey,
  asServiceRole,
  asUser,
  callFunction,
  signInTestUser,
} from "./helpers/api";
import { INTERNAL_JOB_SECRET } from "./helpers/env";

test.describe("C1 — batch_init is a machine-only endpoint", () => {
  test("refuses a caller with no key at all", async () => {
    const res = await callFunction("ensure-token-allowance", { batch_init: true }, asAnonymous);
    expect(res.status).toBe(401);
  });

  test("refuses the anon key, which is printed in the browser bundle", async () => {
    const res = await callFunction("ensure-token-allowance", { batch_init: true }, asAnonKey);
    expect(res.status).toBe(401);
  });

  test("refuses an ordinary logged-in user", async () => {
    const session = await signInTestUser();
    const res = await callFunction(
      "ensure-token-allowance",
      { batch_init: true },
      asUser(session.accessToken),
    );
    expect(res.status).toBe(401);
  });

  test("never describes an account in a refusal", async () => {
    // The leak was the response body, not only the missing check.
    for (const caller of [asAnonymous, asAnonKey]) {
      const res = await callFunction("ensure-token-allowance", { batch_init: true }, caller);
      expect(res.text).not.toMatch(/"allowance"|"tokens_granted"|"user_id"|"userId"/);
    }
  });

  // Positive controls. Without these the suite would still pass if the whole
  // function were dead and refusing everyone.
  test("the ordinary single-user path still works for a logged-in user", async () => {
    const session = await signInTestUser();
    const res = await callFunction("ensure-token-allowance", {}, asUser(session.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });

  test("an authorised machine caller is let through, and gets counts not rows", async () => {
    test.slow();
    const useInternalKey = Boolean(INTERNAL_JOB_SECRET);
    const res = await callFunction(
      "ensure-token-allowance",
      { batch_init: true },
      useInternalKey ? asInternalKey(INTERNAL_JOB_SECRET) : asServiceRole,
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body).toHaveProperty("summary");
    expect(res.text).not.toMatch(/"user_id"|"userId"|"tokens_granted"/);
  });
});
