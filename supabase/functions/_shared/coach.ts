// Shared logic for the artifact coaches (Prompt / Skill / Workflow).
// Each coach is a thin wrapper that supplies a coach-specific system prompt
// and feature name. All three persist chat history in `prompt_coach_messages`
// (LangChain-compatible format `{type, content}`) keyed by `session_id`.
//
// Output contract returned to the frontend (`runCanvasAI`):
//   {
//     assistantMessage: string,
//     canvas: { updated: boolean, content?: string, changeNote?: string },
//     session: { id: string }
//   }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  getServiceClient,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  DEFAULT_MODEL,
  type ChatMessage,
  type ToolDefinition,
} from "./llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_HISTORY_TURNS = 20; // last 20 user+assistant pairs
const CANVAS_TRUNCATE = 16000;

export interface CoachConfig {
  feature: string; // e.g. "prompt-coach"
  artifactName: string; // "prompt" | "skill" | "workflow"
  systemPrompt: string;
}

const RESPOND_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "respond",
    description: "Return the coach's reply to the user and any canvas update.",
    parameters: {
      type: "object",
      properties: {
        assistantMessage: {
          type: "string",
          description:
            "Conversational reply to the user explaining what you did or asking a clarifying question. Plain text or light Markdown. Keep it under 200 words.",
        },
        canvas: {
          type: "object",
          properties: {
            updated: {
              type: "boolean",
              description: "true if the canvas content was modified, false otherwise.",
            },
            content: {
              type: "string",
              description:
                "Full new canvas content. REQUIRED when updated=true. Must be the complete artifact, not a diff.",
            },
            changeNote: {
              type: "string",
              description: "Short (≤80 chars) human-readable summary of the change. REQUIRED when updated=true.",
            },
          },
          required: ["updated"],
          additionalProperties: false,
        },
      },
      required: ["assistantMessage", "canvas"],
      additionalProperties: false,
    },
  },
};

function baseSystemSuffix(artifactName: string): string {
  return `

----------------------------------------
INPUT FORMAT
----------------------------------------
Each user turn arrives as a structured block:
  mode: chat_only | collab_edit
  user_message: <free text>
  canvas_content: <the full current ${artifactName} text>
  selection: <optional substring the user highlighted>

----------------------------------------
MODE RULES
----------------------------------------
If mode == "chat_only":
- NEVER modify the canvas. Set canvas.updated = false.
- Answer the user's question conversationally.

If mode == "collab_edit":
- You MAY modify the canvas if the user's request implies a change.
- When you modify: set canvas.updated = true, return the FULL new canvas in canvas.content,
  and a short canvas.changeNote describing what changed.
- If the user only asks a question, set canvas.updated = false.

----------------------------------------
OUTPUT
----------------------------------------
ALWAYS reply by calling the \`respond\` tool. Never reply with plain text.`;
}

function buildSystemPrompt(cfg: CoachConfig): string {
  return cfg.systemPrompt + baseSystemSuffix(cfg.artifactName);
}

// LangChain stores messages as { type: "human"|"ai"|"system", content: ... }
// in the JSONB column. We mirror that format for compatibility with any
// future tooling that reads the table.
interface StoredMessage {
  type: "human" | "ai" | "system";
  content: string;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
}

async function loadHistory(sessionId: string): Promise<ChatMessage[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("prompt_coach_messages")
    .select("id, message")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });

  if (error) {
    console.error("[coach.loadHistory] error:", error);
    return [];
  }

  const messages: ChatMessage[] = [];
  for (const row of (data ?? []) as Array<{ id: number; message: StoredMessage }>) {
    const m = row.message;
    if (!m || typeof m.content !== "string") continue;
    if (m.type === "human") messages.push({ role: "user", content: m.content });
    else if (m.type === "ai") messages.push({ role: "assistant", content: m.content });
  }

  // Cap to last N turns (keep ordering)
  if (messages.length > MAX_HISTORY_TURNS * 2) {
    return messages.slice(messages.length - MAX_HISTORY_TURNS * 2);
  }
  return messages;
}

async function appendHistory(
  sessionId: string,
  human: string,
  ai: string,
): Promise<void> {
  const sb = getServiceClient();
  const rows = [
    { session_id: sessionId, message: { type: "human", content: human, additional_kwargs: {}, response_metadata: {} } },
    { session_id: sessionId, message: { type: "ai", content: ai, additional_kwargs: {}, response_metadata: {} } },
  ];
  const { error } = await sb.from("prompt_coach_messages").insert(rows);
  if (error) console.error("[coach.appendHistory] error:", error);
}

export function startCoachServer(cfg: CoachConfig) {
  const systemPrompt = buildSystemPrompt(cfg);

  serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const user_id = await getCallerUserId(req);
      const body = await req.json().catch(() => ({}));
      const {
        mode = "chat_only",
        message = "",
        canvas_content = "",
        selection = null,
        session_id,
        workspace_id = null,
      } = body ?? {};

      if (!session_id || typeof session_id !== "string") {
        return new Response(JSON.stringify({ error: "session_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!message || typeof message !== "string" || !message.trim()) {
        return new Response(JSON.stringify({ error: "message is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (mode !== "chat_only" && mode !== "collab_edit") {
        return new Response(JSON.stringify({ error: "mode must be chat_only or collab_edit" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await assertCredits(user_id);

      const history = await loadHistory(session_id);

      const truncatedCanvas = (canvas_content ?? "").toString().slice(0, CANVAS_TRUNCATE);
      const selectionBlock = selection?.text
        ? `\nselection: ${JSON.stringify(String(selection.text).slice(0, 2000))}`
        : "";

      const userTurn = `mode: ${mode}
user_message: ${message}
canvas_content: <<<
${truncatedCanvas}
>>>${selectionBlock}`;

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userTurn },
      ];

      const result = await callLovableAI({
        user_id,
        feature: cfg.feature,
        model: DEFAULT_MODEL,
        messages,
        tools: [RESPOND_TOOL],
        tool_choice: { type: "function", function: { name: "respond" } },
        temperature: 0.5,
        metadata: {
          artifact: cfg.artifactName,
          mode,
          session_id,
          workspace_id,
          canvas_length: (canvas_content ?? "").length,
          history_turns: history.length,
        },
      });

      const call = result.tool_calls[0];
      if (!call?.function?.arguments) {
        return new Response(JSON.stringify({ error: "Coach returned no response" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let parsed: {
        assistantMessage?: string;
        canvas?: { updated?: boolean; content?: string; changeNote?: string };
      };
      try {
        parsed = JSON.parse(call.function.arguments);
      } catch (e) {
        console.error(`[${cfg.feature}] JSON parse error:`, e, call.function.arguments?.slice(0, 200));
        return new Response(JSON.stringify({ error: "Coach returned invalid JSON" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const assistantMessage = (parsed.assistantMessage ?? "").toString().trim() || "Done.";
      const canvas = parsed.canvas ?? { updated: false };
      // Force chat_only to never edit
      if (mode === "chat_only") canvas.updated = false;
      // If updated=true but no content, downgrade to no-op
      if (canvas.updated && !canvas.content) canvas.updated = false;

      // Persist history (best-effort)
      try {
        await appendHistory(session_id, message, assistantMessage);
      } catch (e) {
        console.error(`[${cfg.feature}] history append failed:`, e);
      }

      return new Response(
        JSON.stringify({
          assistantMessage,
          canvas: {
            updated: !!canvas.updated,
            content: canvas.updated ? canvas.content : undefined,
            changeNote: canvas.updated ? (canvas.changeNote || "Updated") : undefined,
          },
          session: { id: session_id },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error) {
      if (error instanceof CreditsExhaustedError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (error instanceof RateLimitedError) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please retry shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (error instanceof GatewayError) {
        console.error(`[${cfg.feature}] Gateway error:`, error.status, error.message);
        return new Response(JSON.stringify({ error: "Upstream AI gateway error" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (
        msg === "Missing Authorization bearer token" ||
        msg === "Invalid auth token" ||
        msg === "Empty bearer token"
      ) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error(`[${cfg.feature}] Error:`, msg);
      return new Response(JSON.stringify({ error: "Coach request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  });
}
