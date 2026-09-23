// The smaller findings of the 2026-09-16 audit that can be seen from outside
// (godspeed decision D-214, migration 20260916150000). Each test names the hole it
// closes. Nothing here writes a row that survives the test.

import { test, expect } from "@playwright/test";
import {
  restAsAnon,
  restAsService,
  restAsUser,
  signInTestUser,
} from "./helpers/api";

test.describe("Functions the anon key could call", () => {
  test("generate_unique_slug no longer answers whether a slug exists", async () => {
    const res = await restAsAnon("rpc/generate_unique_slug", {
      method: "POST",
      body: { p_title: "anything", p_table: "prompts" },
    });
    expect(res.ok, "an anonymous caller could still probe slugs").toBe(false);

    const asUser = await restAsUser("rpc/generate_unique_slug", {
      method: "POST",
      body: { p_title: "anything", p_table: "prompts" },
    });
    expect(asUser.ok, "a signed-in caller could still probe slugs").toBe(false);
  });

  test("a logged-out visitor learns whether signup is open, not how many accounts exist", async () => {
    const res = await restAsAnon<Record<string, unknown>>(
      "rpc/check_signup_allowed",
      { method: "POST", body: {} },
    );
    expect(res.ok, JSON.stringify(res.error)).toBe(true);
    expect(typeof res.data.allowed).toBe("boolean");
    expect(res.data).not.toHaveProperty("current_count");
    expect(res.data).not.toHaveProperty("max_count");
  });
});

test.describe("The Menerio connection key is write-only", () => {
  test("a user cannot select the key column, even on their own row", async () => {
    await signInTestUser();
    const res = await restAsUser(
      "menerio_integration?select=menerio_api_key&limit=1",
    );
    expect(res.ok, "menerio_api_key is readable by a browser session").toBe(
      false,
    );
  });

  test("no key is stored in plaintext", async () => {
    const res = await restAsService<Array<{ id: string }>>(
      "menerio_integration?select=id&menerio_api_key=not.is.null",
    );
    expect(res.ok, JSON.stringify(res.error)).toBe(true);
    expect(res.data).toHaveLength(0);
  });
});

test.describe("Team activity is for the team", () => {
  test("a user reads no activity of a team they are not in", async () => {
    const { userId } = await signInTestUser();

    const teams = await restAsService<Array<{ id: string }>>(
      "teams?select=id&limit=50",
    );
    const mine = await restAsService<Array<{ team_id: string }>>(
      `team_members?select=team_id&user_id=eq.${userId}`,
    );
    const memberOf = new Set((mine.data ?? []).map((m) => m.team_id));
    const foreign = (teams.data ?? []).find((t) => !memberOf.has(t.id));
    test.skip(!foreign, "every team on the project includes the test account");

    const res = await restAsUser<Array<{ id: string }>>(
      `activity_events?select=id&team_id=eq.${foreign!.id}&limit=10`,
    );
    expect(res.ok, JSON.stringify(res.error)).toBe(true);
    expect(res.data, "a non-member read another team's activity").toHaveLength(
      0,
    );

    // And cannot write into it either.
    const write = await restAsUser("activity_events", {
      method: "POST",
      body: {
        actor_id: userId,
        team_id: foreign!.id,
        action: "security_suite_probe",
      },
    });
    if (write.ok) {
      await restAsService(
        `activity_events?actor_id=eq.${userId}&action=eq.security_suite_probe`,
        { method: "DELETE" },
      );
    }
    expect(write.ok, "a non-member wrote into another team's feed").toBe(false);
  });
});

test.describe("A bookmark needs a prompt you can see", () => {
  test("a private prompt of another user cannot be saved by id", async () => {
    const { userId } = await signInTestUser();
    const other = await restAsService<Array<{ id: string }>>(
      `prompts?select=id&is_public=eq.false&author_id=neq.${userId}&team_id=is.null&limit=1`,
    );
    test.skip(!other.data?.length, "no private prompt of another user exists");

    const res = await restAsUser("user_saved_prompts", {
      method: "POST",
      body: { user_id: userId, prompt_id: other.data[0].id },
    });
    if (res.ok) {
      await restAsService(
        `user_saved_prompts?user_id=eq.${userId}&prompt_id=eq.${other.data[0].id}`,
        { method: "DELETE" },
      );
    }
    expect(res.ok, "a private prompt was bookmarked by id").toBe(false);
  });
});
