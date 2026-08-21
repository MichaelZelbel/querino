// The caller nobody wrote down.
//
// Two of the machine endpoints also have a human button:
//   * ModerationPanel.tsx presses "trigger AI review" -> ai-moderate-content
//   * Admin.tsx runs batch_init on mount               -> ensure-token-allowance
//
// Both arrive as an ordinary user JWT, not as a job. Phase 0 locked batch_init
// to the service-role key and silently broke the Admin page's allowance table
// for a day before anyone noticed, because the page falls back to reading the
// database and looks fine. Phase 1 nearly did the same to the moderation
// button. Twice is a pattern, so it gets a test.
//
// HOW THIS WORKS, AND WHY IT IS SAFE
//
// The suite promotes its own test account to admin, asserts, and demotes it
// again. user_roles has UNIQUE (user_id), so a role is one row and a promotion
// is one UPDATE. The demotion runs in afterAll, which Playwright runs even when
// a test fails, and beforeAll demotes first in case a previous run was killed
// outright. The account is a throwaway that owns nothing.

import { test, expect } from "@playwright/test";
import { asUser, callFunction, restAsService, signInTestUser } from "./helpers/api";

async function setRole(role: "free" | "admin"): Promise<void> {
  const { userId } = await signInTestUser();
  const res = await restAsService(`user_roles?user_id=eq.${userId}`, {
    method: "PATCH",
    body: { role },
    headers: { Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error(`Could not set role to ${role}: ${JSON.stringify(res.error)}`);
}

async function currentRole(): Promise<string | null> {
  const { userId } = await signInTestUser();
  const res = await restAsService<Array<{ role: string }>>(
    `user_roles?user_id=eq.${userId}&select=role`,
  );
  return res.data?.[0]?.role ?? null;
}

// Belt and braces: demote before, demote after.
test.beforeAll(async () => {
  await setRole("free");
});

test.afterAll(async () => {
  await setRole("free");
  expect(await currentRole()).toBe("free");
});

test.describe("An admin can still drive the jobs by hand", () => {
  test("a non-admin is refused by both", async () => {
    await setRole("free");
    const session = await signInTestUser();

    const moderate = await callFunction("ai-moderate-content", {}, asUser(session.accessToken));
    expect(moderate.status).toBe(401);

    const batch = await callFunction(
      "ensure-token-allowance",
      { batch_init: true },
      asUser(session.accessToken),
    );
    expect(batch.status).toBe(401);
  });

  test("an admin is let through by both", async () => {
    test.slow();
    await setRole("admin");
    expect(await currentRole(), "the promotion must have taken").toBe("admin");

    const session = await signInTestUser();

    const moderate = await callFunction("ai-moderate-content", {}, asUser(session.accessToken));
    expect(moderate.status, "the ModerationPanel button must work").toBe(200);

    const batch = await callFunction(
      "ensure-token-allowance",
      { batch_init: true },
      asUser(session.accessToken),
    );
    expect(batch.status, "the Admin page's batch_init must work").toBe(200);

    // Admin or not, the response is counts. This is finding C1, and being an
    // admin is not a reason to hand the whole user list back over HTTP.
    expect(batch.body).toHaveProperty("summary");
    expect(batch.text).not.toMatch(/"user_id"|"userId"|"tokens_granted"/);
  });

  test("the promotion is undone", async () => {
    await setRole("free");
    expect(await currentRole()).toBe("free");

    const session = await signInTestUser();
    const batch = await callFunction(
      "ensure-token-allowance",
      { batch_init: true },
      asUser(session.accessToken),
    );
    expect(batch.status, "demoting must actually take effect").toBe(401);
  });
});
