// The model catalogue is the one table in this project meant to be read by
// strangers. That makes it worth testing from both directions: it really is
// readable with no credential, and it really is not writable with one that
// every visitor already has.
//
// It also carries the check the whole feature exists for. Querino's model list
// was a constant somebody typed, and within three days of being written it
// quoted $0.05/$0.10 for a model OpenRouter was charging $0.08/$0.15 for. So
// the last test here asks the only question that matters: is every model this
// app is configured to call still a model that exists?

import { test, expect } from "@playwright/test";
import {
  asAnonKey,
  asAnonymous,
  asInternalKey,
  asUser,
  callFunction,
  restAsService,
  restAsUser,
  signInTestUser,
} from "./helpers/api";
import {
  ANON_KEY,
  FUNCTIONS_URL,
  INTERNAL_JOB_SECRET,
  REST_URL,
  SUPABASE_URL,
} from "./helpers/env";

interface CatalogueModel {
  provider: string;
  model_id: string;
  supports_tools: boolean;
  prompt_price_per_m: number | null;
  retired_at: string | null;
}

interface CatalogueResponse {
  synced_at: string | null;
  count: number;
  models: CatalogueModel[];
}

async function publicCatalogue(query = ""): Promise<CatalogueResponse> {
  // Deliberately no apikey and no Authorization header. If this needs either,
  // the endpoint is not the shared catalogue it claims to be.
  const res = await fetch(`${FUNCTIONS_URL}/llm-models${query}`);
  // Read the body exactly once: a Response can only be consumed one way, so
  // reading it for the failure message would leave nothing to parse.
  const text = await res.text();
  expect(res.status, text.slice(0, 300)).toBe(200);
  return JSON.parse(text) as CatalogueResponse;
}

test.describe("the model catalogue is public, and it is not writable", () => {
  test("a stranger with no credential at all can read it", async () => {
    const body = await publicCatalogue();
    expect(
      body.count,
      "the catalogue is empty. Has sync-llm-models run yet?",
    ).toBeGreaterThan(50);
    expect(body.models[0].model_id).toBeTruthy();
    expect(body.synced_at).toBeTruthy();
  });

  test("it is cacheable, which is what keeps it cheap to leave open", async () => {
    const res = await fetch(`${FUNCTIONS_URL}/llm-models`);
    const cacheControl = res.headers.get("cache-control") ?? "";
    expect(
      cacheControl,
      "without cache headers every request reaches the function, which is the " +
        "cost this endpoint was designed to avoid",
    ).toContain("s-maxage");
  });

  test("the filters actually filter", async () => {
    const all = await publicCatalogue();
    const tools = await publicCatalogue("?tools=true");
    expect(tools.count).toBeGreaterThan(0);
    expect(tools.count).toBeLessThan(all.count);
    expect(tools.models.every((m) => m.supports_tools)).toBe(true);

    const cheap = await publicCatalogue("?tools=true&max_prompt_price=0.5");
    // A model with no fixed price cannot be under a ceiling, so it must not
    // sneak through as if it were free.
    expect(
      cheap.models.every(
        (m) => m.prompt_price_per_m !== null && m.prompt_price_per_m <= 0.5,
      ),
    ).toBe(true);
  });

  test("retired models are hidden unless they are asked for", async () => {
    const visible = await publicCatalogue();
    expect(visible.models.some((m) => m.retired_at !== null)).toBe(false);
    // include_retired is allowed to return the same set when nothing has been
    // retired yet; what it must never do is hide a live model.
    const withRetired = await publicCatalogue("?include_retired=true");
    expect(withRetired.count).toBeGreaterThanOrEqual(visible.count);
  });

  // The plan was to keep the open endpoint cheap with Cache-Control so
  // Cloudflare would answer repeat requests itself. Measured on 2026-08-26 that
  // does not happen: a function response is CF-Cache-Status: DYNAMIC every
  // time, while a public storage object is HIT. So the whole list is also
  // written to a bucket, and that URL is the one to hand to another app.
  test("the CDN snapshot is served without invoking anything", async () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/llm-catalogue/models.json`;

    const first = await fetch(url);
    expect(
      first.status,
      "no snapshot has been written. Has sync-llm-models run since the bucket existed?",
    ).toBe(200);
    const body = (await first.json()) as CatalogueResponse;
    expect(body.count).toBeGreaterThan(50);
    expect(body.synced_at).toBeTruthy();

    // The second request is the one that matters: it must come off the edge.
    const second = await fetch(url);
    expect(
      second.headers.get("cf-cache-status"),
      "the snapshot is not being cached, which was the whole reason for writing it",
    ).toBe("HIT");
  });

  test("the snapshot agrees with the endpoint", async () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/llm-catalogue/models.json`;
    const snapshot = (await (await fetch(url)).json()) as CatalogueResponse;
    const live = await publicCatalogue("?provider=openrouter");
    // The snapshot is written by the same run that fills the table, so a
    // difference means one of the two writes failed and nothing said so.
    expect(Math.abs(snapshot.count - live.count)).toBeLessThanOrEqual(5);
  });

  test("the anon key can read the table but cannot write to it", async () => {
    const read = await fetch(`${REST_URL}/llm_models?select=model_id&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    expect(read.status, "public catalogue data should be readable").toBe(200);

    const write = await fetch(`${REST_URL}/llm_models`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "openrouter",
        model_id: "attacker/injected-model",
        name: "injected",
      }),
    });
    expect(
      write.ok,
      "the anon key wrote a row into the shared model catalogue. Every app " +
        "that reads this list would now offer it.",
    ).toBe(false);

    const check = await restAsService<Array<{ model_id: string }>>(
      "llm_models?model_id=eq.attacker/injected-model&select=model_id",
    );
    expect(check.data.length).toBe(0);
  });

  test("the alerts are admin-only, unlike the catalogue itself", async () => {
    const res = await restAsUser<unknown[]>("llm_model_alerts?select=id");
    const rows = Array.isArray(res.data) ? res.data : [];
    expect(
      rows.length,
      "an ordinary account can read which models this app is configured to use",
    ).toBe(0);
  });
});

test.describe("the sync job is not reachable by the public", () => {
  test("no credential is refused", async () => {
    const res = await callFunction("sync-llm-models", {}, asAnonymous);
    expect(res.status).toBe(401);
  });

  test("the anon key is refused, which is the one a stranger has", async () => {
    const res = await callFunction("sync-llm-models", {}, asAnonKey);
    expect(res.status).toBe(401);
  });

  test("a signed-in non-admin is refused too", async () => {
    const session = await signInTestUser();
    const res = await callFunction(
      "sync-llm-models",
      {},
      asUser(session.accessToken),
    );
    expect(res.status).toBe(401);
  });

  test("the internal key gets in, which is how pg_cron calls it", async () => {
    test.skip(
      !INTERNAL_JOB_SECRET,
      "needs INTERNAL_JOB_SECRET; skipped on purpose",
    );
    const res = await callFunction(
      "sync-llm-models",
      {},
      asInternalKey(INTERNAL_JOB_SECRET),
    );
    expect(res.status).toBe(200);
    const body = res.body as { ok?: boolean; fetched?: number };
    expect(body.ok).toBe(true);
    expect(body.fetched).toBeGreaterThan(50);
  });
});

// The point of the whole feature.
test.describe("every configured model still exists", () => {
  test("no call site is pointed at a model the provider has dropped", async () => {
    const catalogue = await publicCatalogue("?provider=openrouter");
    test.skip(
      catalogue.count === 0,
      "the catalogue is empty; run the sync first",
    );
    const live = new Set(catalogue.models.map((m) => m.model_id));

    const configs = await restAsService<
      Array<{
        call_site: string;
        provider: string;
        model: string;
        enabled: boolean;
      }>
    >("llm_call_configs?select=call_site,provider,model,enabled");

    const missing = (configs.data ?? [])
      .filter((c) => c.enabled && c.provider === "openrouter")
      .filter((c) => !live.has(c.model))
      .map((c) => `${c.call_site} -> ${c.model}`);

    expect(
      missing,
      "these call sites are pointed at models OpenRouter no longer lists. Every " +
        "call they make fails. The nightly job should have caught this.",
    ).toEqual([]);
  });

  test("a call site that needs tool calling has a model that supports it", async () => {
    const catalogue = await publicCatalogue("?provider=openrouter");
    test.skip(
      catalogue.count === 0,
      "the catalogue is empty; run the sync first",
    );
    const toolless = new Set(
      catalogue.models.filter((m) => !m.supports_tools).map((m) => m.model_id),
    );

    // The eleven that send a tools array. Held level with the code by
    // supabase/functions/_shared/llm-registry_test.ts.
    const NEEDS_TOOLS = [
      "ai-moderate-content",
      "prompt-coach",
      "prompt-kit-coach",
      "prompt-refinement",
      "skill-coach",
      "suggest-metadata",
      "suggest-promptkit-metadata",
      "suggest-skill-metadata",
      "suggest-workflow-metadata",
      "translate-artifact",
      "workflow-coach",
    ];

    const configs = await restAsService<
      Array<{
        call_site: string;
        provider: string;
        model: string;
        enabled: boolean;
      }>
    >("llm_call_configs?select=call_site,provider,model,enabled");

    const broken = (configs.data ?? [])
      .filter((c) => c.enabled && c.provider === "openrouter")
      .filter((c) => NEEDS_TOOLS.includes(c.call_site) && toolless.has(c.model))
      .map((c) => `${c.call_site} -> ${c.model}`);

    expect(
      broken,
      "these call sites send a tools array to a model that does not support " +
        "one. It will not error, it will answer in prose and the parse will fail.",
    ).toEqual([]);
  });
});
