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

// Candidate override models per provider. The test picks the first one that
// differs from what the row currently says, so the override is real whatever
// an administrator has configured. One candidate was not enough: on
// 2026-09-08 the admin had set suggest-metadata to the single OpenRouter
// candidate, and the test failed on its own precondition rather than on the
// feature it exists to check.
const OVERRIDE_CANDIDATES_BY_PROVIDER: Record<string, string[]> = {
  openrouter: [
    "mistralai/mistral-small-3.2-24b-instruct",
    "google/gemini-2.5-flash-lite",
  ],
  lovable: ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash"],
  openai: ["gpt-4o-mini", "gpt-4.1-mini"],
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
    test.setTimeout(CACHE_TTL_MS + 150_000);

    const current = await restAsService<ConfigRow[]>(
      `${ROW}&select=provider,model,enabled`,
    );
    original = current.data[0];
    expect(
      original,
      "no default-tier row for this call site; is the migration applied?",
    ).toBeTruthy();

    const candidates = OVERRIDE_CANDIDATES_BY_PROVIDER[original.provider];
    expect(
      candidates,
      `no override models known for provider "${original.provider}"; add some to OVERRIDE_CANDIDATES_BY_PROVIDER`,
    ).toBeTruthy();
    const overrideModel = candidates.find((m) => m !== original!.model);
    expect(
      overrideModel,
      `every candidate override for "${original.provider}" is the configured model; add another to OVERRIDE_CANDIDATES_BY_PROVIDER`,
    ).toBeTruthy();

    await restAsService(ROW, {
      method: "PATCH",
      body: { model: overrideModel, enabled: true },
    });

    const session = await signInTestUser();
    const askTheCallSite = () =>
      callFunction(
        "suggest-metadata",
        {
          prompt_content:
            "Write a haiku about a cat sitting on a warm windowsill.",
        },
        asUser(session.accessToken),
      );

    // Outwait the resolver's per-isolate cache, measured from a call this test
    // made itself.
    //
    // Sleeping CACHE_TTL_MS from the PATCH was wrong, and it went red on
    // 2026-09-08 in a full-suite run while passing on its own. The cache clock
    // starts at whichever request last read the config, and in a full run an
    // earlier test had asked this same call site a few seconds before. Its
    // entry then outlived the sleep and the invocation below still used the
    // old model. One throwaway call first puts the entry at a known age, so
    // the wait after it is the whole lifetime.
    await askTheCallSite();
    await new Promise((r) => setTimeout(r, CACHE_TTL_MS + 2_000));

    const res = await askTheCallSite();

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
