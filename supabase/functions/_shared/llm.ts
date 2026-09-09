// Shared helper for calling the Lovable AI Gateway and recording token usage.
// Replaces the n8n-based LLM orchestration. Each feature edge function should
// validate the caller's JWT, then call `callLovableAI` with the resulting
// user_id. Token accounting goes into `llm_usage_events` and the user's
// current `ai_allowance_periods` row atomically via the `record_llm_usage` RPC.

import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ensureAllowance } from "./allowance.ts";
import {
  resolveConfig,
  resolveTier,
  interpolatePrompt,
  applySystemPrompt,
  type DbLike,
  type EffectiveConfig,
  type ConfigSource,
} from "./llm-config.ts";
import {
  callProvider,
  ProviderHttpError,
  type ProviderRequest,
  type ToolDefinition as ProviderToolDefinition,
  type ToolChoice,
} from "./llm-providers.ts";
import {
  PROVIDER_SECRETS,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL as REGISTRY_DEFAULT_MODEL,
  getCallSiteMeta,
  type Provider,
} from "./llm-registry.ts";

// One source of truth, in llm-registry.ts. Re-exported here because several
// functions already import DEFAULT_MODEL from this module.
export const DEFAULT_MODEL = REGISTRY_DEFAULT_MODEL;

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  // Optional fields used when passing tool-call results back to the model.
  tool_call_id?: string;
  name?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
}

export interface CallOptions {
  user_id: string;
  feature: string;
  messages: ChatMessage[];
  model?: string;
  tools?: ToolDefinition[];
  tool_choice?:
    "auto" | "required" | { type: "function"; function: { name: string } };
  temperature?: number;
  // Optional metadata stored alongside the usage event (e.g. framework, goal).
  metadata?: Record<string, unknown>;
  // Optional idempotency key. If omitted a UUID is generated.
  idempotency_key?: string;
  /** Values for {{placeholder}} substitution in a configured system prompt. */
  templateVars?: Record<string, string | number | null | undefined>;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface CallResult {
  content: string | null;
  tool_calls: ToolCall[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  /** The provider that actually served the call, after config resolution. */
  provider: Provider;
  /** Which row decided it: db-free, db-premium, db-default or fallback-default. */
  config_source: ConfigSource;
  raw: unknown;
}

export class CreditsExhaustedError extends Error {
  constructor(message = "AI credits exhausted") {
    super(message);
    this.name = "CreditsExhaustedError";
  }
}

export class RateLimitedError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitedError";
  }
}

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "GatewayError";
  }
}

/**
 * Build a service-role Supabase client. Edge functions use this internally for
 * the credit gate and the usage RPC. Never return this client to the caller.
 */
export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Validate the caller's bearer token and return the authenticated user id.
 * Throws if the token is missing or invalid.
 */
export async function getCallerUserId(req: Request): Promise<string> {
  const authHeader =
    req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization bearer token");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) throw new Error("Empty bearer token");

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data?.user?.id) {
    throw new Error("Invalid auth token");
  }
  return data.user.id;
}

/**
 * Verify the user has remaining credits. Throws CreditsExhaustedError if not.
 */
export async function assertCredits(
  user_id: string,
  supabase?: SupabaseClient,
): Promise<void> {
  const sb = supabase ?? getServiceClient();

  const read = async () =>
    await sb
      .from("v_ai_allowance_current")
      .select("remaining_tokens, remaining_credits")
      .eq("user_id", user_id)
      .maybeSingle();

  const first = await read();
  let data = first.data;
  const error = first.error;

  if (error) {
    // Fail CLOSED: during an allowance-view outage, paid AI calls would
    // otherwise go through ungated without limit. The message is distinct
    // from the out-of-credits case so users know it's temporary.
    console.error("[llm.assertCredits] view error:", error);
    throw new Error(
      "AI features are temporarily unavailable (credit check failed). Please try again in a moment.",
    );
  }

  // Brand new accounts have no allowance period yet. Provision one on demand
  // instead of falsely reporting "out of credits" on their first AI action.
  if (!data) {
    try {
      await ensureAllowance(sb, user_id, { createdBy: "llm.assertCredits" });
    } catch (e) {
      console.error("[llm.assertCredits] on-demand provisioning failed:", e);
    }
    const retry = await read();
    data = retry.data;
    if (retry.error) {
      console.error(
        "[llm.assertCredits] view error after provisioning:",
        retry.error,
      );
    }
  }

  const remaining = Number(data?.remaining_tokens ?? 0);
  if (!data || remaining <= 0) {
    throw new CreditsExhaustedError(
      "You have used all your AI credits for this period. They will reset shortly, or contact support@querino.ai.",
    );
  }
}

/**
 * Turn a resolved config plus a caller's messages into a provider request.
 * Exported and pure so the system-message swap is testable without network.
 */
export function buildProviderRequest(
  config: EffectiveConfig,
  opts: {
    messages: ChatMessage[];
    apiKey: string;
    tools?: ToolDefinition[];
    tool_choice?: ToolChoice;
    templateVars?: Record<string, string | number | null | undefined>;
  },
): ProviderRequest {
  const prompt = interpolatePrompt(config.system_prompt, opts.templateVars);
  return {
    provider: config.provider,
    model: config.model,
    messages: applySystemPrompt(opts.messages, prompt),
    temperature: config.temperature,
    maxTokens: config.max_tokens,
    tools: opts.tools as ProviderToolDefinition[] | undefined,
    toolChoice: opts.tool_choice,
    apiKey: opts.apiKey,
  };
}

/**
 * The model a call site runs on when the config table has no enabled row for
 * it, or cannot be read. The registry is the one place that says which sites
 * are cheap background jobs and which are chat, so the fallback is read from
 * there; a caller may still pin a model explicitly. Before 2026-09-08 every
 * fallback landed on the chat model, which put the eight background sites on a
 * model roughly five times the intended price whenever the table was down.
 */
export function fallbackModelFor(feature: string, pinned?: string): string {
  return pinned || getCallSiteMeta(feature)?.model || DEFAULT_MODEL;
}

/**
 * Resolve this call site's configuration, call whichever provider it names,
 * record token usage, return the parsed result. Usage recording is best-effort
 * through the record_llm_usage RPC: an accounting failure is logged, never
 * turned into a failed answer (tests/security/07 pins that down).
 *
 * The name is historical: it no longer only calls Lovable. Keeping it means the
 * fifteen call sites that already pass a `feature` string became configurable
 * without one line changing in any of them.
 */
export async function callLovableAI(opts: CallOptions): Promise<CallResult> {
  const sb = getServiceClient();
  const db = sb as unknown as DbLike;

  const tier = await resolveTier(db, opts.user_id ?? null);
  const { effective, source } = await resolveConfig(db, opts.feature, tier, {
    provider: DEFAULT_PROVIDER,
    model: fallbackModelFor(opts.feature, opts.model),
    temperature: opts.temperature ?? null,
  });

  const secretName = PROVIDER_SECRETS[effective.provider];
  const apiKey = Deno.env.get(secretName);
  if (!apiKey) {
    throw new Error(
      `${secretName} is not configured, which call site "${opts.feature}" needs for provider "${effective.provider}"`,
    );
  }

  const request = buildProviderRequest(effective, {
    messages: opts.messages,
    apiKey,
    tools: opts.tools,
    tool_choice: opts.tool_choice,
    templateVars: opts.templateVars,
  });

  let result;
  try {
    result = await callProvider(request);
  } catch (e) {
    // Map the transport's error onto the classes every caller already handles,
    // so rewiring the provider layer changed nothing for any of them.
    if (e instanceof ProviderHttpError) {
      if (e.status === 429) throw new RateLimitedError(e.message);
      // A 402 from the provider is OUR account being out of money, not the
      // user's allowance. CreditsExhaustedError is reserved for assertCredits;
      // mapping the upstream one onto it told every user, full allowance or
      // not, that they had spent their credits, and quoted the provider's
      // top-up text at them.
      if (e.status === 402) {
        console.error(
          `[llm.callLovableAI] provider ${effective.provider} answered 402 for call site "${opts.feature}": the provider account needs funding`,
        );
        throw new GatewayError(
          502,
          `Provider ${effective.provider} refused the call (payment required on the provider account)`,
        );
      }
      throw new GatewayError(e.status, e.message);
    }
    throw e;
  }

  // Best-effort token logging. Never block the response on accounting errors.
  try {
    const { error } = await sb.rpc("record_llm_usage", {
      p_user_id: opts.user_id,
      p_idempotency_key: opts.idempotency_key ?? crypto.randomUUID(),
      p_feature: opts.feature,
      p_provider: effective.provider,
      p_model: result.model,
      p_prompt_tokens: result.usage.prompt_tokens,
      p_completion_tokens: result.usage.completion_tokens,
      p_total_tokens: result.usage.total_tokens,
      p_metadata: { ...(opts.metadata ?? {}), config_source: source },
    });
    if (error)
      console.error("[llm.callLovableAI] record_llm_usage error:", error);
  } catch (e) {
    console.error("[llm.callLovableAI] usage logging threw:", e);
  }

  return {
    content: result.content,
    tool_calls: result.tool_calls,
    usage: result.usage,
    model: result.model,
    provider: effective.provider,
    config_source: source,
    raw: result.raw,
  };
}
