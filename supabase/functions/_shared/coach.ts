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
import { corsHeadersFor } from "./cors.ts";
import { baseSystemSuffix } from "./prompts/coach-suffix.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  getServiceClient,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  DEFAULT_MODEL,
  capText,
  type ChatMessage,
  type ToolDefinition,
} from "./llm.ts";

const MAX_HISTORY_TURNS = 20; // last 20 user+assistant pairs
export const CANVAS_TRUNCATE = 16000;
// The credit gate only checks for a balance above zero, so the message is
// capped too, not only the canvas. Since 2026-09-16.
const MESSAGE_TRUNCATE = 4000;

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
              description:
                "true if the canvas content was modified, false otherwise.",
            },
            content: {
              type: "string",
              description:
                "Full new canvas content. REQUIRED when updated=true. Must be the complete artifact, not a diff.",
            },
            changeNote: {
              type: "string",
              description:
                "Short (≤80 chars) human-readable summary of the change. REQUIRED when updated=true.",
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

/** What a coach actually sends: its own text plus the block all four share. */
export function buildSystemPrompt(cfg: CoachConfig): string {
  return cfg.systemPrompt + baseSystemSuffix(cfg.artifactName);
}

// ── A canvas longer than the coach can see (30 September 2026) ──────────────
//
// The canvas is cut at CANVAS_TRUNCATE characters to bound the cost of one
// call, and in collab_edit the model answers with "the complete artifact, not
// a diff", which the editor applies in place of everything the user had. So a
// 70,000-character skill came back as an edit of its first 16,000 characters,
// the other 54,000 were gone from the editor, and the next save made that
// permanent. Eight artifacts in production were longer than the cut when this
// was found. A cut canvas is now read, never rewritten: the model is told it
// sees only the start, and an edit it sends anyway is dropped here.

export interface PreparedCanvas {
  /** What the model is shown. */
  text: string;
  /** True when `text` is only the start of the canvas. */
  truncated: boolean;
  /** The full length of the canvas the editor holds. */
  length: number;
}

export function prepareCanvas(
  raw: unknown,
  limit: number = CANVAS_TRUNCATE,
): PreparedCanvas {
  const full = typeof raw === "string" ? raw : "";
  return {
    text: full.length > limit ? full.slice(0, limit) : full,
    truncated: full.length > limit,
    length: full.length,
  };
}

/** The user turn the model reads for one message. */
export function buildUserTurn(
  mode: string,
  message: string,
  canvas: PreparedCanvas,
  selectionBlock: string,
): string {
  // A cut canvas is discussed, not edited, so the model is not asked for an
  // edit it would have to invent the end of.
  const effectiveMode = canvas.truncated ? "chat_only" : mode;
  const note = canvas.truncated
    ? `\ncanvas_note: canvas_content is only the first ${canvas.text.length} of ${canvas.length} characters. Do not rewrite the canvas; answer in the chat, and say which part you could not see if it matters.`
    : "";
  return `mode: ${effectiveMode}${note}
user_message: ${message}
canvas_content: <<<
${canvas.text}
>>>${selectionBlock}`;
}

export interface CoachReply {
  assistantMessage: string;
  canvas: { updated: boolean; content?: string; changeNote?: string };
}

/**
 * The model's tool arguments, turned into what the browser may apply.
 * chat_only never edits, an update without content is no update, and a cut
 * canvas is never replaced.
 */
export function shapeCoachReply(
  parsed: unknown,
  requestedMode: string,
  canvas: PreparedCanvas,
  artifactName: string,
): CoachReply {
  // Forced tool arguments are almost always an object, but "almost" has cost
  // a 500 before: a null or a bare string parses fine and then throws on
  // property access.
  const args =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as {
          assistantMessage?: unknown;
          canvas?: unknown;
        })
      : {};
  let assistantMessage = String(args.assistantMessage ?? "").trim() || "Done.";
  const proposed =
    args.canvas &&
    typeof args.canvas === "object" &&
    !Array.isArray(args.canvas)
      ? (args.canvas as {
          updated?: unknown;
          content?: unknown;
          changeNote?: unknown;
        })
      : {};

  let updated = !!proposed.updated;
  if (requestedMode === "chat_only") updated = false;
  if (typeof proposed.content !== "string" || proposed.content.length === 0) {
    updated = false;
  }
  if (canvas.truncated) {
    updated = false;
    if (requestedMode === "collab_edit") {
      const seen = canvas.text.length.toLocaleString("en-US");
      const total = canvas.length.toLocaleString("en-US");
      assistantMessage +=
        `\n\n(I could only read the first ${seen} of this ${artifactName}'s ${total} characters, ` +
        "so I left the editor as it was: an edit from me would have replaced everything after that point.)";
    }
  }

  if (!updated) return { assistantMessage, canvas: { updated: false } };
  return {
    assistantMessage,
    canvas: {
      updated: true,
      content: proposed.content as string,
      changeNote:
        (typeof proposed.changeNote === "string" && proposed.changeNote) ||
        "Updated",
    },
  };
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

async function loadHistory(
  sessionId: string,
  userId: string,
): Promise<ChatMessage[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("prompt_coach_messages")
    .select("id, message")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    // Newest first and limited, then reversed below. Oldest-first with no
    // limit hit PostgREST's 1000-row cap on a long session and dropped the
    // NEWEST turns, so the coach answered a conversation from weeks ago.
    .order("id", { ascending: false })
    .limit(MAX_HISTORY_TURNS * 2);

  if (error) {
    console.error("[coach.loadHistory] error:", error);
    return [];
  }

  const rows = (
    (data ?? []) as Array<{
      id: number;
      message: StoredMessage;
    }>
  )
    .slice()
    .reverse();

  const messages: ChatMessage[] = [];
  for (const row of rows) {
    const m = row.message;
    if (!m || typeof m.content !== "string") continue;
    if (m.type === "human") messages.push({ role: "user", content: m.content });
    else if (m.type === "ai")
      messages.push({ role: "assistant", content: m.content });
  }

  // Cap to last N turns (keep ordering)
  if (messages.length > MAX_HISTORY_TURNS * 2) {
    return messages.slice(messages.length - MAX_HISTORY_TURNS * 2);
  }
  return messages;
}

async function appendHistory(
  sessionId: string,
  userId: string,
  human: string,
  ai: string,
): Promise<void> {
  const sb = getServiceClient();
  const rows = [
    {
      session_id: sessionId,
      user_id: userId,
      message: {
        type: "human",
        content: human,
        additional_kwargs: {},
        response_metadata: {},
      },
    },
    {
      session_id: sessionId,
      user_id: userId,
      message: {
        type: "ai",
        content: ai,
        additional_kwargs: {},
        response_metadata: {},
      },
    },
  ];
  const { error } = await sb.from("prompt_coach_messages").insert(rows);
  if (error) console.error("[coach.appendHistory] error:", error);
}

export function startCoachServer(cfg: CoachConfig) {
  const systemPrompt = buildSystemPrompt(cfg);

  serve(async (req) => {
    const corsHeaders = corsHeadersFor(req);
    if (req.method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });

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
        return new Response(
          JSON.stringify({ error: "session_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (!message || typeof message !== "string" || !message.trim()) {
        return new Response(JSON.stringify({ error: "message is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (mode !== "chat_only" && mode !== "collab_edit") {
        return new Response(
          JSON.stringify({ error: "mode must be chat_only or collab_edit" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      await assertCredits(user_id);

      const history = await loadHistory(session_id, user_id);

      const canvas = prepareCanvas(canvas_content);
      const truncatedMessage = capText(message, MESSAGE_TRUNCATE);
      const selectionBlock = selection?.text
        ? `\nselection: ${JSON.stringify(String(selection.text).slice(0, 2000))}`
        : "";

      const userTurn = buildUserTurn(
        mode,
        truncatedMessage,
        canvas,
        selectionBlock,
      );

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
          canvas_length: canvas.length,
          canvas_truncated: canvas.truncated,
          history_turns: history.length,
        },
      });

      const call = result.tool_calls[0];
      if (!call?.function?.arguments) {
        return new Response(
          JSON.stringify({ error: "Coach returned no response" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(call.function.arguments);
      } catch (e) {
        console.error(
          `[${cfg.feature}] JSON parse error:`,
          e,
          call.function.arguments?.slice(0, 200),
        );
        return new Response(
          JSON.stringify({ error: "Coach returned invalid JSON" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const reply = shapeCoachReply(parsed, mode, canvas, cfg.artifactName);
      const assistantMessage = reply.assistantMessage;

      // Persist history (best-effort)
      try {
        await appendHistory(
          session_id,
          user_id,
          truncatedMessage,
          assistantMessage,
        );
      } catch (e) {
        console.error(`[${cfg.feature}] history append failed:`, e);
      }

      return new Response(
        JSON.stringify({
          assistantMessage,
          canvas: reply.canvas,
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
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded, please retry shortly.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (error instanceof GatewayError) {
        console.error(
          `[${cfg.feature}] Gateway error:`,
          error.status,
          error.message,
        );
        return new Response(
          JSON.stringify({ error: "Upstream AI gateway error" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
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
