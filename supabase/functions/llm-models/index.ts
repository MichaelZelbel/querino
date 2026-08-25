// The model catalogue, readable by anything.
//
// Querino already keeps the cross-application AI-artifacts registry, so it is
// the natural place for one shared list of which models exist, what they cost
// and which of them can call tools. Menerio, the hub and anything later read
// this rather than each keeping their own constant that goes stale in three
// days, which is exactly what happened to Querino's own.
//
// OPEN ON PURPOSE, AND WHY THAT IS SAFE
//
// This mirrors a catalogue OpenRouter serves to the public with no API key, so
// there is nothing here to protect and no credential to distribute. The obvious
// worry is somebody hammering it. Three things answer that, in order of how
// much they matter:
//
//   1. Supabase already puts Cloudflare in front of every edge function.
//      Verified 2026-08-26 from the response headers of an existing public
//      function: `Server: cloudflare`, `CF-Ray`, `CF-Cache-Status`. Volumetric
//      traffic is absorbed before it reaches this code.
//   2. The cache headers below let Cloudflare answer repeat requests itself.
//      Function responses come back CF-Cache-Status: DYNAMIC by default only
//      because nothing here sent cache headers before.
//   3. What does reach us is served from module memory, so a flood costs a warm
//      isolate and no database work at all.
//
// What this deliberately does NOT do is rate limit per IP inside the function.
// The invocation is counted and billed before this code runs, so an in-function
// limiter adds a lookup and a failure mode and prevents nothing. To block a
// request you have to stop it in front of the function, which is point 1.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** The catalogue changes once a day, so this can be generous. */
const MEMORY_TTL_MS = 10 * 60 * 1000;

interface PublicModel {
  provider: string;
  model_id: string;
  name: string;
  context_length: number | null;
  prompt_price_per_m: number | null;
  completion_price_per_m: number | null;
  supports_tools: boolean;
  input_modalities: string[];
  output_modalities: string[];
  expiration_date: string | null;
  retired_at: string | null;
  last_seen_at: string;
}

let cache: { at: number; models: PublicModel[] } | null = null;

async function loadAll(): Promise<PublicModel[]> {
  if (cache && Date.now() - cache.at < MEMORY_TTL_MS) return cache.models;

  // The anon key, not the service role. This table is world-readable by policy,
  // so the endpoint has no more access than any visitor already has, and a bug
  // here cannot reach a row the policy would not have handed over anyway.
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await db
    .from("llm_models")
    .select(
      "provider, model_id, name, context_length, prompt_price_per_m, completion_price_per_m, supports_tools, input_modalities, output_modalities, expiration_date, retired_at, last_seen_at",
    )
    .order("provider")
    .order("model_id");

  if (error) throw new Error(error.message);

  const models = (data ?? []) as PublicModel[];
  cache = { at: Date.now(), models };
  return models;
}

function truthy(value: string | null): boolean {
  return value === "" || value === "1" || value?.toLowerCase() === "true";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Use GET" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams;
    let models = await loadAll();

    // Retired models are excluded by default. They are kept rather than deleted
    // because a consumer looking at an old configuration needs to be able to
    // ask what happened to a model, and "no such row" does not answer that.
    if (!truthy(q.get("include_retired"))) {
      models = models.filter((m) => !m.retired_at);
    }
    const provider = q.get("provider");
    if (provider) models = models.filter((m) => m.provider === provider);

    if (truthy(q.get("tools"))) models = models.filter((m) => m.supports_tools);

    const maxPrice = Number(q.get("max_prompt_price"));
    if (Number.isFinite(maxPrice) && q.get("max_prompt_price") !== null) {
      // A model with no fixed price cannot be compared against a ceiling, so it
      // is excluded rather than silently treated as free.
      models = models.filter(
        (m) =>
          m.prompt_price_per_m !== null && m.prompt_price_per_m <= maxPrice,
      );
    }

    const search = q.get("q")?.toLowerCase().trim();
    if (search) {
      models = models.filter(
        (m) =>
          m.model_id.toLowerCase().includes(search) ||
          m.name.toLowerCase().includes(search),
      );
    }

    const syncedAt = models.reduce<string | null>(
      (latest, m) =>
        !latest || m.last_seen_at > latest ? m.last_seen_at : latest,
      null,
    );

    return new Response(
      JSON.stringify({ synced_at: syncedAt, count: models.length, models }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          // max-age for the browser, s-maxage for Cloudflare. The catalogue is
          // refreshed once a night, so an hour at the edge is conservative.
          "Cache-Control": "public, max-age=900, s-maxage=3600",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[llm-models]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
