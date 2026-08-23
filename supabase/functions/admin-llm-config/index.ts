// Read, seed and test-run the LLM call configuration. Admin only.
//
// The identity comes from the JWT via isAdminCaller, never from the body. That
// is the repo's non-negotiable rule and the reason this file does not accept a
// user_id at all.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { isAdminCaller } from "../_shared/internalAuth.ts";
import {
  CALL_SITES,
  getCallSiteMeta,
  PROVIDER_PRESETS,
  PROVIDER_SECRETS,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
} from "../_shared/llm-registry.ts";
import {
  getDefaultSystemPrompt,
  normalizeSystemPrompt,
} from "../_shared/llm-default-prompts.ts";
import { callProvider, providerAvailability } from "../_shared/llm-providers.ts";
import {
  resolveConfig,
  interpolatePrompt,
  __clearConfigCache,
  type DbLike,
} from "../_shared/llm-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDERS = Object.keys(PROVIDER_SECRETS) as (keyof typeof PROVIDER_SECRETS)[];

/**
 * The caller's own user id, read from the JWT. Only used to stamp updated_by;
 * authorisation has already happened in isAdminCaller. Never from the body.
 */
async function callerUserId(req: Request, admin: SupabaseClient): Promise<string | null> {
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const { data } = await admin.auth.getUser(header.slice("Bearer ".length).trim());
  return data?.user?.id ?? null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Insert any call site the registry knows about and the table does not, and
 * backfill an empty description. Never overwrites an administrator's edit.
 *
 * `force` overwrites every column from the registry. Destructive, and only used
 * deliberately.
 */
async function syncDefaults(admin: SupabaseClient, force: boolean): Promise<void> {
  const rows = CALL_SITES.map((c) => ({
    call_site: c.call_site,
    tier: "default",
    description: c.description,
    provider: c.provider,
    model: c.model,
    system_prompt: null,
    enabled: true,
  }));

  if (force) {
    const { error } = await admin
      .from("llm_call_configs")
      .upsert(rows, { onConflict: "call_site,tier" });
    if (error) throw error;
    return;
  }

  const { data: existing, error: readErr } = await admin
    .from("llm_call_configs")
    .select("call_site, description")
    .eq("tier", "default");
  if (readErr) throw readErr;

  const seen = new Map<string, string | null>(
    (existing ?? []).map((r: { call_site: string; description: string | null }) =>
      [r.call_site, r.description] as [string, string | null]
    ),
  );

  const toInsert = rows.filter((r) => !seen.has(r.call_site));
  if (toInsert.length > 0) {
    const { error } = await admin.from("llm_call_configs").insert(toInsert);
    if (error) throw error;
  }

  for (const c of CALL_SITES) {
    if (!seen.has(c.call_site)) continue;
    const description = seen.get(c.call_site);
    if (description && description.trim().length > 0) continue;
    const { error } = await admin
      .from("llm_call_configs")
      .update({ description: c.description })
      .eq("call_site", c.call_site)
      .eq("tier", "default");
    if (error) throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await isAdminCaller(req))) {
      return json({ error: "Forbidden - admin only" }, 403);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({})) as {
      action?: string;
      call_site?: string;
      tier?: string;
      prompt?: string;
      force?: boolean;
      patch?: {
        provider?: string;
        model?: string;
        system_prompt?: string | null;
        temperature?: number | null;
        max_tokens?: number | null;
        enabled?: boolean;
      };
    };
    const tier = body.tier === "free" || body.tier === "premium" ? body.tier : "default";

    if (body.action === "list") {
      await syncDefaults(admin, false);
      __clearConfigCache();

      const { data, error } = await admin
        .from("llm_call_configs")
        .select("*")
        .eq("tier", tier)
        .order("call_site");
      if (error) throw error;

      // default_system_prompt is what this call site sends with no override. The
      // panel prefills the box with it, so an administrator can read the prompt
      // in use instead of an empty textarea. It is computed from the code, never
      // stored, which is what keeps `system_prompt IS NULL` meaning "still
      // tracking the code" rather than "nobody has looked yet".
      const configs = (data ?? []).map((row: { call_site: string }) => {
        const meta = getCallSiteMeta(row.call_site);
        return {
          ...row,
          placeholders: meta?.placeholders ?? [],
          default_system_prompt: getDefaultSystemPrompt(row.call_site),
        };
      });

      return json({ configs, availability: providerAvailability(), providers: PROVIDER_PRESETS });
    }

    if (body.action === "save") {
      const callSite = String(body.call_site ?? "");
      if (!callSite) return json({ error: "call_site required" }, 400);
      if (!getCallSiteMeta(callSite)) return json({ error: "Unknown call_site" }, 400);

      const patch = body.patch ?? {};
      if (patch.provider !== undefined && !PROVIDERS.includes(patch.provider as never)) {
        return json({ error: `Unknown provider "${patch.provider}"` }, 400);
      }
      if (patch.model !== undefined && String(patch.model).trim().length === 0) {
        return json({ error: "model cannot be empty" }, 400);
      }

      // Only these columns are writable. call_site and tier identify the row and
      // are never patched, so a save can never rename or retier an entry.
      const update: Record<string, unknown> = { updated_by: await callerUserId(req, admin) };
      if (patch.provider !== undefined) update.provider = patch.provider;
      if (patch.model !== undefined) update.model = String(patch.model).trim();
      // An empty box means "use the code default", and so does a box still
      // holding the code default. The panel prefills it now, so pressing Save
      // without editing is the commonest thing that happens on this page; if
      // that stored the text, the call site would silently stop tracking every
      // later change to the code and the table's "Code default" column would
      // start lying. Enforced here so no client can do it by accident.
      if (patch.system_prompt !== undefined) {
        update.system_prompt = normalizeSystemPrompt(callSite, patch.system_prompt);
      }
      if (patch.temperature !== undefined) update.temperature = patch.temperature;
      if (patch.max_tokens !== undefined) update.max_tokens = patch.max_tokens;
      if (patch.enabled !== undefined) update.enabled = patch.enabled;

      const { error } = await admin
        .from("llm_call_configs")
        .update(update)
        .eq("call_site", callSite)
        .eq("tier", tier);
      if (error) throw error;

      __clearConfigCache();
      return json({ ok: true, call_site: callSite, tier });
    }

    if (body.action === "sync_defaults") {
      await syncDefaults(admin, body.force === true);
      __clearConfigCache();
      return json({
        ok: true,
        force: body.force === true,
        synced: CALL_SITES.map((c) => c.call_site),
      });
    }

    if (body.action === "test") {
      const callSite = String(body.call_site ?? "");
      if (!callSite) return json({ error: "call_site required" }, 400);

      const meta = getCallSiteMeta(callSite);
      const userPrompt = String(
        body.prompt || "Say 'Hello' and tell me which model and provider you are using.",
      );

      // The panel saves before it tests, so this reads the persisted row.
      __clearConfigCache();
      // The code default goes in as the fallback, so testing a call site that
      // has no override exercises the prompt it really sends. Without it the
      // test ran with no system message at all and told the administrator
      // nothing about the prompt they were looking at.
      const { effective, source } = await resolveConfig(
        admin as unknown as DbLike,
        callSite,
        tier,
        {
          provider: DEFAULT_PROVIDER,
          model: DEFAULT_MODEL,
          systemPrompt: getDefaultSystemPrompt(callSite),
        },
      );

      const secretName = PROVIDER_SECRETS[effective.provider];
      const apiKey = Deno.env.get(secretName);
      if (!apiKey) {
        return json({ ok: false, error: `${secretName} is not configured` });
      }

      const templateVars: Record<string, string> = {};
      for (const ph of meta?.placeholders ?? []) {
        templateVars[ph] = `[test value for {{${ph}}}]`;
      }
      const systemPrompt = interpolatePrompt(effective.system_prompt, templateVars);

      const startedAt = Date.now();
      try {
        const result = await callProvider({
          provider: effective.provider,
          model: effective.model,
          apiKey,
          temperature: effective.temperature,
          maxTokens: effective.max_tokens,
          messages: systemPrompt
            ? [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ]
            : [{ role: "user", content: userPrompt }],
        });
        return json({
          ok: true,
          provider: effective.provider,
          model: result.model,
          content: result.content,
          config_source: source,
          latency_ms: Date.now() - startedAt,
          usage: result.usage,
        });
      } catch (err) {
        return json({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          latency_ms: Date.now() - startedAt,
        });
      }
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("admin-llm-config error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
