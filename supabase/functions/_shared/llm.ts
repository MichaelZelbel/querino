// Shared helper for calling the Lovable AI Gateway and recording token usage.
// Replaces the n8n-based LLM orchestration. Each feature edge function should
// validate the caller's JWT, then call `callLovableAI` with the resulting
// user_id. Token accounting goes into `llm_usage_events` and the user's
// current `ai_allowance_periods` row atomically via the `record_llm_usage` RPC.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
  tool_choice?: "auto" | "required" | { type: "function"; function: { name: string } };
  temperature?: number;
  // Optional metadata stored alongside the usage event (e.g. framework, goal).
  metadata?: Record<string, unknown>;
  // Optional idempotency key. If omitted a UUID is generated.
  idempotency_key?: string;
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
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
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
export async function assertCredits(user_id: string, supabase?: SupabaseClient): Promise<void> {
  const sb = supabase ?? getServiceClient();
  // Best-effort: ensure they have an active period (mirrors useAICredits flow).
  // We do not call ensure-token-allowance here to avoid recursion; if the row
  // is missing the user simply has no allowance and we block.
  const { data, error } = await sb
    .from("v_ai_allowance_current")
    .select("remaining_tokens, remaining_credits")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    console.error("[llm.assertCredits] view error:", error);
    return; // fail-open on infra errors; usage will still be ledgered
  }
  const remaining = Number(data?.remaining_tokens ?? 0);
  if (!data || remaining <= 0) {
    throw new CreditsExhaustedError(
      "You have used all your AI credits for this period. They will reset shortly, or contact support@querino.ai.",
    );
  }
}

/**
 * Call the Lovable AI Gateway, record token usage, return parsed result.
 * Always atomic w.r.t. credit accounting via record_llm_usage.
 */
export async function callLovableAI(opts: CallOptions): Promise<CallResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }
  const model = opts.model || DEFAULT_MODEL;

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    stream: false,
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools;
    body.tool_choice = opts.tool_choice ?? "auto";
  }

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 429) throw new RateLimitedError(text || "Rate limited");
    if (response.status === 402) throw new CreditsExhaustedError(text || "Payment required");
    throw new GatewayError(response.status, text || `Gateway error ${response.status}`);
  }

  const json = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: ToolCall[];
      };
    }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    model?: string;
  };

  const choice = json.choices?.[0]?.message;
  const usage = {
    prompt_tokens: Number(json.usage?.prompt_tokens ?? 0),
    completion_tokens: Number(json.usage?.completion_tokens ?? 0),
    total_tokens: Number(json.usage?.total_tokens ?? 0),
  };
  const reportedModel = json.model || model;

  // Best-effort token logging — never block the response on accounting errors.
  try {
    const sb = getServiceClient();
    const { error } = await sb.rpc("record_llm_usage", {
      p_user_id: opts.user_id,
      p_idempotency_key: opts.idempotency_key ?? crypto.randomUUID(),
      p_feature: opts.feature,
      p_provider: "lovable-ai",
      p_model: reportedModel,
      p_prompt_tokens: usage.prompt_tokens,
      p_completion_tokens: usage.completion_tokens,
      p_total_tokens: usage.total_tokens,
      p_metadata: opts.metadata ?? {},
    });
    if (error) console.error("[llm.callLovableAI] record_llm_usage error:", error);
  } catch (e) {
    console.error("[llm.callLovableAI] usage logging threw:", e);
  }

  return {
    content: choice?.content ?? null,
    tool_calls: choice?.tool_calls ?? [],
    usage,
    model: reportedModel,
    raw: json,
  };
}
