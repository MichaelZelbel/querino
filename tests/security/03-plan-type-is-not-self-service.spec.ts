// Finding C3: the "Users can update own profile" policy is USING (auth.uid() =
// id) with no WITH CHECK and no column list, so the only rule was "it must
// still be your row". plan_type decides how many AI credits get granted, so a
// free account could write itself premium and take 1500 credits a month.
//
// Phase 0 closed it with a BEFORE UPDATE trigger. These tests hold that shut,
// and just as importantly hold ordinary profile editing open, because a guard
// that blocks too much is the likelier regression.

import { test, expect } from "@playwright/test";
import { restAsUser, signInTestUser } from "./helpers/api";

interface Profile {
  id: string;
  plan_type: string | null;
  bio: string | null;
}

// plan_type is no longer readable straight off the table. The 2026-08-23
// hardening revoked SELECT on public.profiles and granted it back column by
// column, deliberately leaving role / plan_type / plan_source out so they
// cannot leak to a team-mate, and added get_my_plan() for the caller's own row.
// So the two halves of a profile now come from two places. What this file
// asserts is unchanged: the columns are still readable, they are just read the
// way the application reads them.
async function readProfile(): Promise<Profile> {
  const { userId } = await signInTestUser();

  const cols = await restAsUser<Array<{ id: string; bio: string | null }>>(
    `profiles?id=eq.${userId}&select=id,bio`,
  );
  expect(
    cols.ok,
    `reading own profile failed: ${JSON.stringify(cols.error)}`,
  ).toBe(true);
  const row = cols.data?.[0];
  if (!row) throw new Error("The test account has no profile row.");

  const plan = await restAsUser<Array<{ plan_type: string | null }>>(
    "rpc/get_my_plan",
    {
      method: "POST",
      body: {},
    },
  );
  expect(plan.ok, `get_my_plan failed: ${JSON.stringify(plan.error)}`).toBe(
    true,
  );

  return {
    id: row.id,
    bio: row.bio,
    plan_type: plan.data?.[0]?.plan_type ?? null,
  };
}

// The privileged columns must stay unreadable from the table itself, or the
// hardening above is only a rename of the leak.
async function readPlanTypeOffTheTable() {
  const { userId } = await signInTestUser();
  return restAsUser(`profiles?id=eq.${userId}&select=id,plan_type`);
}

// return=minimal, not representation. PostgREST hands the whole row back for
// representation, and since the 2026-08-23 column grants a signed-in user may
// not read plan_type, so every write would come back 42501 whether the trigger
// allowed it or not. That would have made this file pass for the wrong reason:
// green because the read was denied, not because the write was.
async function patchProfile(patch: Record<string, unknown>) {
  const { userId } = await signInTestUser();
  return restAsUser(`profiles?id=eq.${userId}`, {
    method: "PATCH",
    body: patch,
    headers: { Prefer: "return=minimal" },
  });
}

test.describe("C3 — a user cannot promote itself", () => {
  test("the test account is a free, non-admin account to begin with", async () => {
    const profile = await readProfile();
    expect(profile.plan_type ?? "free").toBe("free");
  });

  test("writing plan_type = premium is refused", async () => {
    const res = await patchProfile({ plan_type: "premium" });

    expect(res.ok, "the update must not succeed").toBe(false);
    expect(JSON.stringify(res.error)).toMatch(/admin/i);

    const after = await readProfile();
    expect(after.plan_type ?? "free").toBe("free");
  });

  test("writing plan_type = team is refused too", async () => {
    const res = await patchProfile({ plan_type: "team" });
    expect(res.ok).toBe(false);

    const after = await readProfile();
    expect(after.plan_type ?? "free").toBe("free");
  });

  test("plan_type is not readable off the profiles table at all", async () => {
    const res = await readPlanTypeOffTheTable();
    expect(
      res.ok,
      "a signed-in user selected plan_type straight from profiles. The column grants have " +
        "come back, and with them the leak of role and plan_type to any team-mate.",
    ).toBe(false);
  });

  test("role and plan_source are refused as well", async () => {
    for (const patch of [{ role: "admin" }, { plan_source: "manual" }]) {
      const res = await patchProfile(patch);
      expect(res.ok, `${JSON.stringify(patch)} must be refused`).toBe(false);
    }
  });

  test("hiding the change among ordinary columns does not smuggle it through", async () => {
    const res = await patchProfile({
      bio: "smuggle attempt",
      plan_type: "premium",
    });
    expect(res.ok).toBe(false);

    const after = await readProfile();
    expect(after.plan_type ?? "free").toBe("free");
  });

  test("ordinary profile editing still works", async () => {
    const original = (await readProfile()).bio;
    const marker = `security-suite ${Date.now()}`;
    try {
      const res = await patchProfile({ bio: marker });
      expect(
        res.ok,
        `editing bio must still work: ${JSON.stringify(res.error)}`,
      ).toBe(true);
      expect((await readProfile()).bio).toBe(marker);
    } finally {
      await patchProfile({ bio: original });
    }
  });
});
