// The point of the whole feature: a row in llm_call_configs actually decides
// which model runs. A config table that the runtime quietly ignores is worse
// than no config table, because the admin page then lies.
//
// This writes a row with the service role, invokes the call site for real, and
// reads the usage ledger back to see which model was really used.
//
// It costs a small number of real AI credits on the test account, the way
// 06-no-credits-means-402 already does, and it takes about 40 seconds because
// the resolver caches a call site's rows for 30 seconds per isolate and nothing
// can flush another function's isolate from here.

import { test, expect } from "@playwright/test";
import {
  asUser,
  callFunction,
  hasManagementToken,
  restAsService,
  signInTestUser,
  sqlQuery,
} from "./helpers/api";

const CALL_SITE = "suggest-metadata";
const CODE_DEFAULT = "google/gemini-3-flash-preview";
const OVERRIDE_MODEL = "google/gemini-2.5-flash-lite";
const ROW = `llm_call_configs?call_site=eq.${CALL_SITE}&tier=eq.default`;

const CACHE_TTL_MS = 30_000;

interface UsageRow {
  model: string;
  provider: string;
  metadata: Record<string, unknown>;
}

test.describe("a call site uses its configured model", () => {
  test.afterAll(async () => {
    // Put it back, so the suite leaves the project as it found it.
    await restAsService(ROW, {
      method: "PATCH",
      body: { model: CODE_DEFAULT, enabled: true },
    });
  });

  test("the ledger records the configured model, not the code default", async () => {
    test.skip(!hasManagementToken(), "needs SUPABASE_ACCESS_TOKEN; skipped in CI on purpose");
    test.setTimeout(CACHE_TTL_MS + 90_000);

    await restAsService(ROW, {
      method: "PATCH",
      body: { model: OVERRIDE_MODEL, enabled: true },
    });

    // Outwait the resolver's per-isolate cache before invoking the call site.
    await new Promise((r) => setTimeout(r, CACHE_TTL_MS + 2_000));

    const session = await signInTestUser();
    const res = await callFunction(
      "suggest-metadata",
      { prompt_content: "Write a haiku about a cat sitting on a warm windowsill." },
      asUser(session.accessToken),
    );
    expect(res.status, `suggest-metadata failed: ${JSON.stringify(res.body)}`).toBe(200);

    const rows = await sqlQuery<UsageRow>(
      `SELECT model, provider, metadata FROM llm_usage_events
       WHERE feature = '${CALL_SITE}'
       ORDER BY created_at DESC LIMIT 1`,
    );

    expect(
      rows[0].model,
      "the config row named a model and the runtime used a different one, so the admin page lies",
    ).toBe(OVERRIDE_MODEL);
    expect(rows[0].provider).toBe("lovable");
    expect(rows[0].metadata.config_source).toBe("db-default");
  });
});
