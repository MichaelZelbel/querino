import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import {
  getCallerUserId,
  assertCredits,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  callLovableAI,
  capText,
} from "../_shared/llm.ts";
import { interpolatePrompt } from "../_shared/llm-config.ts";
import {
  SYSTEM_PROMPT,
  modeInstructions,
} from "../_shared/prompts/canvas-ai.ts";

const ALLOWED_MODES: ReadonlySet<string> = new Set([
  "chat_only",
  "collab_edit",
  "rewrite",
]);
const ALLOWED_ARTIFACT_TYPES: ReadonlySet<string> = new Set([
  "prompt",
  "skill",
  "workflow",
  "prompt_kit",
]);

/**
 * The prompt this call site sends when nobody has overridden it.
 *
 * The text lives in _shared/prompts/canvas-ai.ts as a {{placeholder}} template,
 * so the LLM Config page can show it. Interpolating it here produces exactly
 * what this function built inline before.
 */
function buildSystemPrompt(
  mode: string,
  artifactType: string,
  canvasContent: string,
): string {
  return (
    interpolatePrompt(SYSTEM_PROMPT, {
      mode,
      artifactType,
      canvasContent,
      modeInstructions: modeInstructions(mode),
    }) ?? ""
  );
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let user_id: string;
    try {
      user_id = await getCallerUserId(req);
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      await assertCredits(user_id);
    } catch (e) {
      if (e instanceof CreditsExhaustedError) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    const {
      artifactType,
      artifactId,
      mode,
      message,
      canvasContent,
      selection,
    } = (await req.json().catch(() => ({}))) ?? {};

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "message and canvasContent are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // mode and artifactType are written into the system prompt verbatim, so
    // anything but the known values is refused: until 2026-09-23 a caller
    // could put any text there and it reached the model as instructions.
    // The values are the ones src/lib/runCanvasAI.ts declares. A missing one
    // keeps its old default.
    const requestedMode: unknown = mode || "chat_only";
    const requestedType: unknown = artifactType || "prompt";
    if (
      typeof requestedMode !== "string" ||
      !ALLOWED_MODES.has(requestedMode)
    ) {
      return new Response(
        JSON.stringify({
          error: `mode must be one of: ${[...ALLOWED_MODES].join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (
      typeof requestedType !== "string" ||
      !ALLOWED_ARTIFACT_TYPES.has(requestedType)
    ) {
      return new Response(
        JSON.stringify({
          error: `artifactType must be one of: ${[...ALLOWED_ARTIFACT_TYPES].join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // The credit gate above only asks for a balance above zero, so the size of
    // what one call may send is bounded here. The canvas cap is the one
    // coach.ts uses.
    const cappedCanvas = capText(canvasContent, 16000);
    const cappedMessage = capText(message, 4000);

    const systemPrompt = buildSystemPrompt(
      requestedMode,
      requestedType,
      cappedCanvas,
    );

    let userMessage = cappedMessage;
    if (selection?.text) {
      const selectedText = capText(String(selection.text), 2000);
      userMessage += `\n\n[Selected text (lines ${selection.start}-${selection.end})]: "${selectedText}"`;
    }

    let rawContent = "";
    try {
      // Through the shared helper now, so canvas usage is recorded and
      // deducted like every other AI call instead of being free after the gate.
      const result = await callLovableAI({
        user_id,
        feature: "canvas-ai",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        // The same values the default template is built from, so an override
        // written on the LLM Config page can use every placeholder the panel
        // advertises rather than only some of them.
        templateVars: {
          mode: requestedMode,
          artifactType: requestedType,
          canvasContent: cappedCanvas,
          modeInstructions: modeInstructions(requestedMode),
        },
      });
      rawContent = result.content || "";
    } catch (e) {
      if (e instanceof RateLimitedError) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (e instanceof CreditsExhaustedError) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add credits to continue.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (e instanceof GatewayError) {
        console.error("[canvas-ai] Gateway error:", e.status, e.message);
        return new Response(
          JSON.stringify({ error: "Upstream AI gateway error" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      throw e;
    }

    // Parse the JSON response safely
    let result: {
      assistantMessage: string;
      canvas?: { updated: boolean; content?: string; changeNote?: string };
    };

    try {
      // Strip markdown code fences if present
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr
          .replace(/^```(?:json)?\s*/, "")
          .replace(/\s*```$/, "");
      }
      const parsed: unknown = JSON.parse(jsonStr);
      // JSON.parse happily returns a string, a number, null or an array. Only
      // an object can carry the fields below; anything else is the model
      // answering in prose and is treated like unparseable text, not a 500.
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("model reply is not a JSON object");
      }
      result = parsed as typeof result;
    } catch {
      // Fallback: treat entire response as a chat message
      console.warn("[canvas-ai] Failed to parse JSON, using raw text");
      result = {
        assistantMessage: rawContent,
        canvas: { updated: false },
      };
    }

    // Validate structure
    if (
      !result.assistantMessage ||
      typeof result.assistantMessage !== "string"
    ) {
      result.assistantMessage = rawContent || "I processed your request.";
    }
    // Shape the canvas the way coach.ts does, so the client never receives a
    // model's own idea of it: `updated` is a real boolean, an update without
    // string content is no update, and a chat_only request never edits.
    const canvas =
      result.canvas &&
      typeof result.canvas === "object" &&
      !Array.isArray(result.canvas)
        ? (result.canvas as {
            updated?: unknown;
            content?: unknown;
            changeNote?: unknown;
          })
        : { updated: false };
    let updated = !!canvas.updated;
    if (typeof canvas.content !== "string") updated = false;
    if (requestedMode === "chat_only") updated = false;
    result.canvas = {
      updated,
      content: updated ? (canvas.content as string) : undefined,
      changeNote: updated
        ? (typeof canvas.changeNote === "string" && canvas.changeNote) ||
          "Updated"
        : undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[canvas-ai] Error:", error);
    // The message may name a missing secret or an internal table; the log
    // keeps it, the client gets a fixed line.
    return new Response(JSON.stringify({ error: "Canvas AI failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
