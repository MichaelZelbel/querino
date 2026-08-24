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
const ROW = `llm_call_configs?call_site=eq.${CALL_SITE}&tier=eq.default`;

const CACHE_TTL_MS = 30_000;

// A model this call site is definitely NOT set to, chosen per provider so the
// override is real whatever the row currently says.
const OVERRIDE_BY_PROVIDER: Record<string, string> = {
  openrouter: "mistralai/mistral-small-3.2-24b-instruct",
  lovable: "google/gemini-2.5-flash-lite",
  openai: "gpt-4o-mini",
};

interface UsageRow {
  model: string;
  provider: string;
  metadata: Record<string, unknown>;
}

interface ConfigRow {
  provider: string;
  model: string;
  enabled: boolean;
}

// Captured before the test overrides anything, restored afterwards. Hardcoding
// the restore value would silently rewrite whatever an administrator had
// configured, which is a nasty way for a test to damage production.
let original: ConfigRow | null = null;

test.describe("a call site uses its configured model", () => {
  test.afterAll(async () => {
    if (!original) return;
    await restAsService(ROW, {
      method: "PATCH",
      body: {
        provider: original.provider,
        model: original.model,
        enabled: original.enabled,
      },
    });
  });

  test("the ledger records the configured model, not the code default", async () => {
    test.skip(
      !hasManagementToken(),
      "needs SUPABASE_ACCESS_TOKEN; skipped in CI on purpose",
    );
    test.setTimeout(CACHE_TTL_MS + 90_000);

    const current = await restAsService<ConfigRow[]>(
      `${ROW}&select=provider,model,enabled`,
    );
    original = current.data[0];
    expect(
      original,
      "no default-tier row for this call site; is the migration applied?",
    ).toBeTruthy();

    const overrideModel = OVERRIDE_BY_PROVIDER[original.provider];
    expect(
      overrideModel,
      `no override model known for provider "${original.provider}"; add one to OVERRIDE_BY_PROVIDER`,
    ).toBeTruthy();
    expect(
      overrideModel,
      "the override must differ from the configured model",
    ).not.toBe(original.model);

    await restAsService(ROW, {
      method: "PATCH",
      body: { model: overrideModel, enabled: true },
    });

    // Outwait the resolver's per-isolate cache before invoking the call site.
    await new Promise((r) => setTimeout(r, CACHE_TTL_MS + 2_000));

    const session = await signInTestUser();
    const res = await callFunction(
      "suggest-metadata",
      {
        prompt_content:
          "Write a haiku about a cat sitting on a warm windowsill.",
      },
      asUser(session.accessToken),
    );

    // A 502 here is almost never this feature. The usual cause is the Lovable
    // workspace hitting its own credit limit, which the gateway reports as a
    // 403 credit_limit_reached and which every AI call in the app fails on.
    // Say so, rather than leaving the next person to suspect the resolver.
    if (res.status === 502) {
      throw new Error(
        "suggest-metadata returned 502. Check the edge logs: if they say " +
          "'credit_limit_reached', the Lovable workspace is out of AI credits and EVERY " +
          "AI feature in Querino is down for real users. That is not a fault in the LLM " +
          `configuration. Body: ${JSON.stringify(res.body)}`,
      );
    }
    expect(
      res.status,
      `suggest-metadata failed: ${JSON.stringify(res.body)}`,
    ).toBe(200);

    const rows = await sqlQuery<UsageRow>(
      `SELECT model, provider, metadata FROM llm_usage_events
       WHERE feature = '${CALL_SITE}'
       ORDER BY created_at DESC LIMIT 1`,
    );

    expect(
      rows[0].model,
      "the config row named a model and the runtime used a different one, so the admin page lies",
    ).toBe(overrideModel);
    expect(rows[0].provider).toBe(original.provider);
    expect(rows[0].metadata.config_source).toBe("db-default");
  });
});
