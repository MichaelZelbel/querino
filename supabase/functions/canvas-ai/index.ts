import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import {
  getCallerUserId,
  assertCredits,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  callLovableAI,
} from "../_shared/llm.ts";
import { interpolatePrompt } from "../_shared/llm-config.ts";
import {
  SYSTEM_PROMPT,
  modeInstructions,
} from "../_shared/prompts/canvas-ai.ts";

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

    const systemPrompt = buildSystemPrompt(
      mode || "chat_only",
      artifactType || "prompt",
      canvasContent,
    );

    let userMessage = message;
    if (selection?.text) {
      userMessage += `\n\n[Selected text (lines ${selection.start}-${selection.end})]: "${selection.text}"`;
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
          mode: mode || "chat_only",
          artifactType: artifactType || "prompt",
          canvasContent: canvasContent ?? "",
          modeInstructions: modeInstructions(mode || "chat_only"),
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
    if (
      !result.canvas ||
      typeof result.canvas !== "object" ||
      Array.isArray(result.canvas)
    ) {
      result.canvas = { updated: false };
    }

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
