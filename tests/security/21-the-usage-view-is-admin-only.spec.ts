// The usage summary reads the whole AI ledger across every account, so it is
// exactly the sort of thing that must not be reachable by the people in it.
//
// Two doors, and both are tested, because closing one is not closing the other:
//
//   1. `admin_llm_usage_summary` is SECURITY DEFINER over `llm_usage_events`,
//      whose RLS policy restricts every reader to their own rows. The whole
//      point of SECURITY DEFINER is to step around that, so if EXECUTE were
//      left with its Postgres default of PUBLIC, any signed-in account could
//      call it through PostgREST and read a breakdown of everyone's usage.
//      Postgres grants that default silently, on every CREATE FUNCTION.
//
//   2. The edge function action in front of it, which is the door the panel
//      actually uses.

import { test, expect } from "@playwright/test";
import { asAnonKey, asUser, callFunction, restAsService, signInTestUser } from "./helpers/api";
import { ANON_KEY, REST_URL } from "./helpers/env";

interface CallSiteUsage {
  call_site: string;
  calls: number;
  total_tokens: number;
  by_caller: { caller: string; calls: number }[];
  by_source: { source: string; calls: number }[];
}

// The suite promotes its own throwaway account to admin and puts it back, the
// way 20-the-admin-page-can-read-every-prompt does. beforeAll demotes first so
// a run that died halfway through a previous attempt cannot leave it promoted.
async function setRole(role: "free" | "admin"): Promise<void> {
  const { userId } = await signInTestUser();
  const res = await restAsService(`user_roles?user_id=eq.${userId}`, {
    method: "PATCH",
    body: { role },
    headers: { Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error(`Could not set role to ${role}: ${JSON.stringify(res.error)}`);
}

test.beforeAll(async () => {
  await setRole("free");
});

test.afterAll(async () => {
  await setRole("free");
});

test.describe("the AI usage view is admin-only", () => {
  test("the anon key cannot call the summary function directly", async () => {
    const res = await fetch(`${REST_URL}/rpc/admin_llm_usage_summary`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_since: null }),
    });

    expect(
      res.status,
      "the anon key, which ships in every visitor's browser bundle, is reading a " +
        "breakdown of every account's AI usage. EXECUTE has been left at its default of PUBLIC.",
    ).toBeGreaterThanOrEqual(400);
  });

  test("a signed-in non-admin cannot call the summary function directly either", async () => {
    const session = await signInTestUser();
    const res = await fetch(`${REST_URL}/rpc/admin_llm_usage_summary`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_since: null }),
    });

    expect(
      res.status,
      "an ordinary account read the aggregated usage of every other account",
    ).toBeGreaterThanOrEqual(400);
  });

  test("the usage action refuses a non-admin", async () => {
    const session = await signInTestUser();
    const res = await callFunction(
      "admin-llm-config",
      { action: "usage", days: 30 },
      asUser(session.accessToken),
    );
    expect(res.status).toBe(403);
  });

  test("the usage action refuses the anon key outright", async () => {
    const res = await callFunction("admin-llm-config", { action: "usage", days: 30 }, asAnonKey);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

test.describe("the AI usage view answers the question it was built for", () => {
  test("an admin gets every call site back, dormant ones included", async () => {
    await setRole("admin");
    const session = await signInTestUser();
    const res = await callFunction(
      "admin-llm-config",
      { action: "usage", days: 0 },
      asUser(session.accessToken),
    );
    await setRole("free");

    expect(res.status, `usage failed: ${res.text.slice(0, 300)}`).toBe(200);
    const body = res.body as { call_sites?: CallSiteUsage[]; totals?: { calls: number } };
    const sites = body.call_sites ?? [];

    // Every configured call site appears whether or not anyone has used it. A
    // panel that hid the unused ones would look like the app has four call
    // sites, and an administrator would never find the thirteen that are idle.
    expect(sites.length).toBeGreaterThanOrEqual(17);
    expect(sites.some((s) => s.call_site === "prompt-wizard")).toBe(true);
  });

  test("the ledger's own history is not lost to a null feature column", async () => {
    await setRole("admin");
    const session = await signInTestUser();
    const res = await callFunction(
      "admin-llm-config",
      { action: "usage", days: 0 },
      asUser(session.accessToken),
    );
    await setRole("free");

    const sites = (res.body as { call_sites?: CallSiteUsage[] }).call_sites ?? [];
    const used = sites.filter((s) => s.calls > 0);

    // Roughly half the rows on record predate the `feature` column being
    // written and carry `workflow_name` instead. Grouping on feature alone
    // drops them silently, which is the kind of missing history nobody notices.
    expect(used.length).toBeGreaterThan(0);
    expect(
      used.every((s) => s.by_caller.length > 0),
      "a call site reports calls but nobody made them",
    ).toBe(true);
  });
});
