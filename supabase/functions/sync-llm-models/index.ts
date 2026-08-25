// Refresh the model catalogue, and say what changed.
//
// Runs from pg_cron at 04:20 UTC. An admin can also trigger it by hand from the
// LLM Config tab, which is why this uses requireMachineOrAdmin rather than
// requireMachineCaller.
//
// The decisions live in _shared/openrouter-catalogue.ts, where they can be
// tested without a network or a database. This file is the I/O around them, and
// the order of its steps is the safety property: nothing is marked retired and
// no configured row is touched until the response has been judged plausible.

import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireMachineOrAdmin } from "../_shared/internalAuth.ts";
import {
  diffCatalogue,
  isPlausible,
  mapCatalogue,
  OPENROUTER_MODELS_URL,
  type CatalogueModel,
  type RawModel,
  type StoredModel,
} from "../_shared/openrouter-catalogue.ts";
import { CALL_SITES, getCallSiteMeta } from "../_shared/llm-registry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const PROVIDER = "openrouter";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface AlertRow {
  kind:
    "retired" | "lost_tool_support" | "code_default_retired" | "sync_failed";
  provider?: string | null;
  model_id?: string | null;
  call_site?: string | null;
  tier?: string | null;
  detail?: Record<string, unknown>;
  action_taken?: string | null;
}

async function raiseAlerts(
  admin: SupabaseClient,
  alerts: AlertRow[],
): Promise<void> {
  if (alerts.length === 0) return;
  const { error } = await admin.from("llm_model_alerts").insert(alerts);
  if (error)
    console.error("[sync-llm-models] could not write alerts:", error.message);
}

/**
 * Mail the administrator, best effort.
 *
 * Only ever called when something actually changed. A nightly mail that always
 * says "nothing changed" is a mail you stop reading, and then the one that
 * matters arrives in a folder you no longer open.
 */
async function mailAdmin(
  admin: SupabaseClient,
  subject: string,
  lines: string[],
): Promise<void> {
  try {
    const { error } = await admin.functions.invoke("notify-admin", {
      body: {
        eventType: "llm_model_alert",
        // notify-admin requires userEmail and uses it as the subject line for
        // this event type. The other four are about an account; this one is
        // not, so the field carries the subject rather than an address.
        userEmail: subject,
        metadata: { subject, lines },
      },
    });
    if (error)
      console.error("[sync-llm-models] notify-admin failed:", error.message);
  } catch (e) {
    console.error(
      "[sync-llm-models] notify-admin threw:",
      e instanceof Error ? e.message : e,
    );
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const denied = await requireMachineOrAdmin(req, corsHeaders);
  if (denied) return denied;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const startedAt = Date.now();

  // ── 1. What we already know ───────────────────────────────────────────────
  const { data: storedData, error: storedErr } = await admin
    .from("llm_models")
    .select("provider, model_id, supports_tools, retired_at")
    .eq("provider", PROVIDER);
  if (storedErr) {
    console.error(
      "[sync-llm-models] could not read llm_models:",
      storedErr.message,
    );
    return json({ ok: false, error: storedErr.message }, 500);
  }
  const stored = (storedData ?? []) as StoredModel[];
  const knownLive = stored.filter((r) => !r.retired_at).length;

  // ── 2. The catalogue ──────────────────────────────────────────────────────
  let fetched: CatalogueModel[];
  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);
    const body = (await res.json()) as { data?: RawModel[] };
    fetched = mapCatalogue(body.data ?? [], PROVIDER);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[sync-llm-models] fetch failed:", message);
    await raiseAlerts(admin, [
      {
        kind: "sync_failed",
        provider: PROVIDER,
        detail: { message, known_live: knownLive },
        action_taken: "Nothing was changed.",
      },
    ]);
    await mailAdmin(admin, "Querino: the model catalogue sync failed", [
      `Could not read ${OPENROUTER_MODELS_URL}: ${message}`,
      "Nothing was changed. The next run is tomorrow at 04:20 UTC.",
    ]);
    return json({ ok: false, error: message }, 502);
  }

  // ── 3. The rail ───────────────────────────────────────────────────────────
  //
  // Everything below this point writes. A truncated or half-served response
  // looks exactly like "every model you use was retired overnight", and acting
  // on it would disable every AI call in the app at twenty past four in the
  // morning. Waiting a day costs nothing by comparison.
  if (!isPlausible(fetched.length, knownLive)) {
    const message = `refused a catalogue of ${fetched.length} models against ${knownLive} known live`;
    console.error(`[sync-llm-models] ${message}`);
    await raiseAlerts(admin, [
      {
        kind: "sync_failed",
        provider: PROVIDER,
        detail: { fetched: fetched.length, known_live: knownLive },
        action_taken:
          "Nothing was changed. The response was too small to trust.",
      },
    ]);
    await mailAdmin(
      admin,
      "Querino: the model catalogue sync refused a response",
      [
        `OpenRouter returned ${fetched.length} models; we already knew ${knownLive} live ones.`,
        "That is more than half the catalogue missing, so nothing was changed.",
        "This is the guard working. If OpenRouter really did halve, run the sync by hand to accept it.",
      ],
    );
    return json(
      {
        ok: false,
        error: message,
        fetched: fetched.length,
        known_live: knownLive,
      },
      200,
    );
  }

  const diff = diffCatalogue(stored, fetched);
  const now = new Date().toISOString();

  // ── 4. Write the catalogue ────────────────────────────────────────────────
  //
  // In chunks, because 400-odd rows in one upsert is a large statement and the
  // whole point of this job is that it is boring.
  const rows = fetched.map((m) => ({
    provider: m.provider,
    model_id: m.model_id,
    name: m.name,
    context_length: m.context_length,
    prompt_price_per_m: m.prompt_price_per_m,
    completion_price_per_m: m.completion_price_per_m,
    supports_tools: m.supports_tools,
    input_modalities: m.input_modalities,
    output_modalities: m.output_modalities,
    expiration_date: m.expiration_date,
    last_seen_at: now,
    retired_at: null,
    raw: m.raw,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await admin
      .from("llm_models")
      .upsert(rows.slice(i, i + 100), { onConflict: "provider,model_id" });
    if (error) {
      console.error("[sync-llm-models] upsert failed:", error.message);
      return json({ ok: false, error: error.message }, 500);
    }
  }

  if (diff.retired.length > 0) {
    const { error } = await admin
      .from("llm_models")
      .update({ retired_at: now })
      .eq("provider", PROVIDER)
      .in("model_id", diff.retired);
    if (error)
      console.error("[sync-llm-models] could not mark retired:", error.message);
  }

  // ── 5. What does this mean for the call sites we configured ───────────────
  const byId = new Map(fetched.map((m) => [m.model_id, m]));
  const retired = new Set(diff.retired);
  const lostTools = new Set(diff.lostTools);

  const { data: configData, error: configErr } = await admin
    .from("llm_call_configs")
    .select("call_site, tier, provider, model, enabled");
  if (configErr) {
    console.error(
      "[sync-llm-models] could not read llm_call_configs:",
      configErr.message,
    );
    return json({ ok: false, error: configErr.message }, 500);
  }

  const alerts: AlertRow[] = [];
  const mailLines: string[] = [];

  for (const row of (configData ?? []) as Array<{
    call_site: string;
    tier: string;
    provider: string;
    model: string;
    enabled: boolean;
  }>) {
    if (row.provider !== PROVIDER || !row.enabled) continue;
    const meta = getCallSiteMeta(row.call_site);

    // Not "was in our table and vanished", but the simpler and stricter "is
    // not in the catalogue we just fetched". That also catches a model id
    // typed by hand into the admin page that never existed, which would
    // otherwise fail on every call with nothing saying why.
    const isRetired = !byId.has(row.model);
    // Only where the call site actually sends a tools array. Disabling an
    // insights prompt because a model dropped a parameter it never used would
    // be noise, and noise is how an alert stops being read.
    const brokeTools = lostTools.has(row.model) && meta?.requiresTools === true;

    if (!isRetired && !brokeTools) continue;

    // The mechanism is the one that already exists and is already tested:
    // pickConfig takes the first ENABLED row, so switching this off makes the
    // resolver fall through to the code default. No new resolution path.
    const { error } = await admin
      .from("llm_call_configs")
      .update({ enabled: false })
      .eq("call_site", row.call_site)
      .eq("tier", row.tier);

    const reason = isRetired
      ? `${row.model} is no longer in OpenRouter's catalogue`
      : `${row.model} no longer supports tool calling, which ${row.call_site} needs`;
    const action = error
      ? `Could not switch the row off: ${error.message}`
      : `Switched off, so ${row.call_site} falls back to the model in the code.`;

    alerts.push({
      kind: isRetired ? "retired" : "lost_tool_support",
      provider: PROVIDER,
      model_id: row.model,
      call_site: row.call_site,
      tier: row.tier,
      detail: { reason },
      action_taken: action,
    });
    mailLines.push(`${row.call_site} (${row.tier}): ${reason}. ${action}`);
  }

  // The fallback itself. If the model named in llm-registry.ts is the one that
  // vanished, falling back lands nowhere, and the automation would otherwise
  // report a tidy success while the app was broken.
  const codeDefaults = new Set(
    CALL_SITES.filter((c) => c.provider === PROVIDER).map((c) => c.model),
  );
  for (const model of codeDefaults) {
    if (!retired.has(model)) continue;
    const sites = CALL_SITES.filter((c) => c.model === model).map(
      (c) => c.call_site,
    );
    alerts.push({
      kind: "code_default_retired",
      provider: PROVIDER,
      model_id: model,
      detail: { call_sites: sites },
      action_taken:
        "Nothing can be done automatically. This needs a code change.",
    });
    mailLines.push(
      `THE CODE DEFAULT ${model} was retired. ${sites.length} call site(s) fall back to it, ` +
        `so falling back no longer helps. This one needs a code change in llm-registry.ts.`,
    );
  }

  // ── 6. The CDN copy ───────────────────────────────────────────────────────
  //
  // Measured on this project on 2026-08-26: an edge function response comes back
  // CF-Cache-Status: DYNAMIC on every hit even with Cache-Control set, while a
  // public storage object comes back HIT from the first request. Supabase fronts
  // both with Cloudflare and only caches one of them.
  //
  // So the whole list is also written as one file, and that URL is the one to
  // give another application: served by the CDN, no function invocation, and
  // impossible to make expensive with traffic. Best effort, because a snapshot
  // that failed to upload is worth less than the sync that just succeeded.
  try {
    const snapshot = {
      synced_at: now,
      provider: PROVIDER,
      count: fetched.length,
      models: fetched.map((m) => ({
        provider: m.provider,
        model_id: m.model_id,
        name: m.name,
        context_length: m.context_length,
        prompt_price_per_m: m.prompt_price_per_m,
        completion_price_per_m: m.completion_price_per_m,
        supports_tools: m.supports_tools,
        input_modalities: m.input_modalities,
        output_modalities: m.output_modalities,
        expiration_date: m.expiration_date,
      })),
    };
    const { error } = await admin.storage
      .from("llm-catalogue")
      .upload("models.json", JSON.stringify(snapshot), {
        contentType: "application/json",
        cacheControl: "3600",
        upsert: true,
      });
    if (error)
      console.error("[sync-llm-models] snapshot upload failed:", error.message);
  } catch (e) {
    console.error(
      "[sync-llm-models] snapshot upload threw:",
      e instanceof Error ? e.message : e,
    );
  }

  await raiseAlerts(admin, alerts);

  if (mailLines.length > 0) {
    await mailAdmin(admin, "Querino: a configured model was retired", [
      ...mailLines,
      "",
      "Open Admin, LLM Config to choose a replacement.",
    ]);
  }

  const summary = {
    ok: true,
    fetched: fetched.length,
    added: diff.added.length,
    retired: diff.retired.length,
    unretired: diff.unretired.length,
    lost_tools: diff.lostTools.length,
    call_sites_disabled: alerts.filter((a) =>
      a.action_taken?.startsWith("Switched off"),
    ).length,
    alerts: alerts.length,
    ms: Date.now() - startedAt,
  };
  console.log("[sync-llm-models]", JSON.stringify(summary));
  return json(summary);
});
