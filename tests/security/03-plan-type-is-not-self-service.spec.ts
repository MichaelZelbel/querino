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

async function readProfile(): Promise<Profile> {
  const { userId } = await signInTestUser();
  const res = await restAsUser<Profile[]>(
    `profiles?id=eq.${userId}&select=id,plan_type,bio`,
  );
  expect(res.ok, `reading own profile failed: ${JSON.stringify(res.error)}`).toBe(true);
  const row = res.data?.[0];
  if (!row) throw new Error("The test account has no profile row.");
  return row;
}

async function patchProfile(patch: Record<string, unknown>) {
  const { userId } = await signInTestUser();
  return restAsUser(`profiles?id=eq.${userId}`, {
    method: "PATCH",
    body: patch,
    headers: { Prefer: "return=representation" },
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

  test("role and plan_source are refused as well", async () => {
    for (const patch of [{ role: "admin" }, { plan_source: "manual" }]) {
      const res = await patchProfile(patch);
      expect(res.ok, `${JSON.stringify(patch)} must be refused`).toBe(false);
    }
  });

  test("hiding the change among ordinary columns does not smuggle it through", async () => {
    const res = await patchProfile({ bio: "smuggle attempt", plan_type: "premium" });
    expect(res.ok).toBe(false);

    const after = await readProfile();
    expect(after.plan_type ?? "free").toBe("free");
  });

  test("ordinary profile editing still works", async () => {
    const original = (await readProfile()).bio;
    const marker = `security-suite ${Date.now()}`;
    try {
      const res = await patchProfile({ bio: marker });
      expect(res.ok, `editing bio must still work: ${JSON.stringify(res.error)}`).toBe(true);
      expect((await readProfile()).bio).toBe(marker);
    } finally {
      await patchProfile({ bio: original });
    }
  });
});
