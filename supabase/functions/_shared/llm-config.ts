// Resolving what a call site should actually do, given what the administrator
// configured and what the code would otherwise have done.
//
// The I/O and the logic are deliberately separate. loadConfigRows fetches every
// tier row for one call site in a single query (at most three), and pickConfig
// chooses among them as a pure function. Menerio's version does both at once
// and therefore cannot be tested without a database.

import { DEFAULT_PROVIDER, DEFAULT_MODEL, type Provider, type Tier } from "./llm-registry.ts";

export interface ConfigRow {
  call_site: string;
  tier: Tier;
  provider: Provider;
  model: string;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
  extra_options: Record<string, unknown>;
  enabled: boolean;
}

export interface CallDefaults {
  provider: Provider;
  model: string;
  systemPrompt?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
}

export interface EffectiveConfig {
  provider: Provider;
  model: string;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
}

export type ConfigSource = "db-free" | "db-premium" | "db-default" | "fallback-default";

export interface ChatMessageLike {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
}

/**
 * The shape of the supabase client this module needs, structurally. Declared
 * rather than imported so the unit tests type-check with no network.
 */
export interface DbLike {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): PromiseLike<{
        data: unknown[] | null;
        error: { message: string } | null;
      }>;
    };
  };
}

function usable(prompt: string | null | undefined): boolean {
  return typeof prompt === "string" && prompt.trim().length > 0;
}

/**
 * Choose the effective config from every tier row a call site has.
 *
 * The chain is: the caller's own tier, then the 'default' tier, then the code
 * default the caller passed in. First ENABLED match wins, so switching a tier
 * row off restores the tier below it rather than blocking the call.
 */
export function pickConfig(
  rows: ConfigRow[],
  tier: Tier,
  defaults: CallDefaults,
): { effective: EffectiveConfig; source: ConfigSource } {
  const enabled = rows.filter((r) => r.enabled);
  const exact = tier === "default" ? undefined : enabled.find((r) => r.tier === tier);
  const chosen = exact ?? enabled.find((r) => r.tier === "default");

  if (!chosen) {
    return {
      effective: {
        provider: defaults.provider,
        model: defaults.model,
        system_prompt: usable(defaults.systemPrompt) ? defaults.systemPrompt! : null,
        temperature: defaults.temperature ?? null,
        max_tokens: defaults.maxTokens ?? null,
      },
      source: "fallback-default",
    };
  }

  return {
    effective: {
      provider: chosen.provider,
      model: chosen.model,
      // An empty or whitespace prompt is not an override. It means the admin
      // cleared the box, which is "use the code default", not "send nothing".
      system_prompt: usable(chosen.system_prompt)
        ? chosen.system_prompt
        : (usable(defaults.systemPrompt) ? defaults.systemPrompt! : null),
      temperature: chosen.temperature ?? defaults.temperature ?? null,
      max_tokens: chosen.max_tokens ?? defaults.maxTokens ?? null,
    },
    source: `db-${chosen.tier}` as ConfigSource,
  };
}

/**
 * Which roles get the premium configuration. Everything unrecognised is free,
 * because the safe mistake is giving someone the cheaper model, not the dearer.
 */
export function mapRoleToTier(role: string | null | undefined): Tier {
  if (role === "premium" || role === "premium_gift" || role === "admin") return "premium";
  return "free";
}

/**
 * Replace {{key}}. A missing key collapses to empty with a warning, so a
 * misconfigured prompt never leaks literal braces to the model.
 */
export function interpolatePrompt(
  prompt: string | null,
  vars?: Record<string, string | number | null | undefined>,
): string | null {
  if (prompt === null || prompt === undefined) return null;
  if (!vars) return prompt;
  return prompt.replace(/\{\{(\w+)\}\}/g, (_m: string, key: string) => {
    if (!(key in vars)) {
      console.warn(`[llm-config] missing template var: ${key}`);
      return "";
    }
    return String(vars[key] ?? "");
  });
}

/**
 * Put the effective system prompt into a message list: replace the existing
 * system message, or prepend one. A null prompt leaves the list untouched.
 */
export function applySystemPrompt<T extends ChatMessageLike>(
  messages: T[],
  systemPrompt: string | null,
): T[] {
  if (!usable(systemPrompt)) return messages;
  const hasSystem = messages.some((m) => m.role === "system");
  if (hasSystem) {
    return messages.map((m) => (m.role === "system" ? { ...m, content: systemPrompt! } : m));
  }
  return [{ role: "system", content: systemPrompt! } as T, ...messages];
}

const CACHE_TTL_MS = 30_000;
const configCache = new Map<string, { rows: ConfigRow[]; at: number }>();
const tierCache = new Map<string, { tier: Tier; at: number }>();

/** Test seam. Also useful from the admin function after a write. */
export function __clearConfigCache(): void {
  configCache.clear();
  tierCache.clear();
}

/** Every tier row for one call site, in one query. At most three rows. */
export async function loadConfigRows(db: DbLike, callSite: string): Promise<ConfigRow[]> {
  const cached = configCache.get(callSite);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.rows;

  const { data, error } = await db
    .from("llm_call_configs")
    .select(
      "call_site, tier, provider, model, system_prompt, temperature, max_tokens, extra_options, enabled",
    )
    .eq("call_site", callSite);

  if (error) {
    // Fail OPEN, unlike the credit gate. A config-table outage must not stop
    // the app doing AI at all; it just means everyone gets the code default.
    console.warn(`[llm-config] load failed for ${callSite}: ${error.message}`);
    configCache.set(callSite, { rows: [], at: Date.now() });
    return [];
  }

  const rows = (data ?? []) as ConfigRow[];
  configCache.set(callSite, { rows, at: Date.now() });
  return rows;
}

/** The caller's tier, from user_roles. No user id means a machine caller. */
export async function resolveTier(db: DbLike, userId: string | null): Promise<Tier> {
  if (!userId) return "default";

  const cached = tierCache.get(userId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.tier;

  const { data, error } = await db.from("user_roles").select("role").eq("user_id", userId);
  if (error) {
    console.warn(`[llm-config] role lookup failed for ${userId}: ${error.message}`);
    return "free";
  }
  const first = (data ?? [])[0] as { role?: string } | undefined;
  const tier = mapRoleToTier(first?.role ?? null);
  tierCache.set(userId, { tier, at: Date.now() });
  return tier;
}

export async function resolveConfig(
  db: DbLike,
  callSite: string,
  tier: Tier,
  defaults: CallDefaults,
): Promise<{ effective: EffectiveConfig; source: ConfigSource }> {
  return pickConfig(await loadConfigRows(db, callSite), tier, defaults);
}

/**
 * For callers that build their own request and cannot go through
 * callLovableAI. Returns the interpolated prompt, never null.
 */
export async function resolveSystemPrompt(
  db: DbLike,
  callSite: string,
  tier: Tier,
  fallback: string,
  vars?: Record<string, string | number | null | undefined>,
): Promise<string> {
  // Only the resolved system_prompt is used here, so provider and model are
  // placeholders; they still name the real default rather than a dead one.
  const { effective } = await resolveConfig(db, callSite, tier, {
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    systemPrompt: fallback,
  });
  return interpolatePrompt(effective.system_prompt, vars) ?? fallback;
}
