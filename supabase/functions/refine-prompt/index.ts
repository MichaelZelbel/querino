import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  OutputTruncatedError,
  type ToolDefinition,
} from "../_shared/llm.ts";
import { tooLongToRefine } from "../_shared/inputLimit.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/refine-prompt.ts";

const REFINE_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "return_refined_prompt",
    description:
      "Return the rewritten production-grade prompt and a short explanation of the changes.",
    parameters: {
      type: "object",
      properties: {
        refinedPrompt: {
          type: "string",
          description:
            "The rewritten, production-grade prompt. No commentary, no markdown fences.",
        },
        explanation: {
          type: "string",
          description: "A 1-3 sentence summary of what was improved and why.",
        },
      },
      required: ["refinedPrompt", "explanation"],
      additionalProperties: false,
    },
  },
};

interface RefineBody {
  prompt?: string;
  framework?: string;
  goal?: string;
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth: derive user_id from JWT (never trust body)
    const user_id = await getCallerUserId(req);

    // 2. Parse + validate body
    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return new Response(
        JSON.stringify({ error: "Request body must be a JSON object" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const body = raw as RefineBody;
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const framework = (body.framework ?? "auto").toString().slice(0, 64);
    const goal = (body.goal ?? "").toString().slice(0, 500);

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refused whole rather than cut (7 October 2026). This used to read the
    // first 16,000 characters, and the Refine dialog saved the model's rewrite
    // of that start as the prompt's entire content, so everything after it was
    // gone. Before the credit check, so a refusal costs nothing.
    const tooLong = tooLongToRefine(prompt);
    if (tooLong) {
      return new Response(
        JSON.stringify({ error: tooLong, code: "content_too_long" }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Credit gate
    await assertCredits(user_id);

    // 4. Build messages
    const userMsg = [
      `Framework: ${framework}`,
      goal ? `Goal: ${goal}` : null,
      "",
      "Original Prompt:",
      prompt,
      "",
      "Rewrite this as a production-grade prompt.",
    ]
      .filter((x) => x !== null)
      .join("\n");

    // 5. Call LLM (also records token usage)
    const result = await callLovableAI({
      user_id,
      feature: "prompt-refinement",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      tools: [REFINE_TOOL],
      tool_choice: {
        type: "function",
        function: { name: "return_refined_prompt" },
      },
      metadata: {
        framework,
        goal_length: goal.length,
        prompt_length: prompt.length,
      },
    });

    // 6. Extract structured output (tool call) with sane fallback
    let refinedPrompt = "";
    let explanation: string | undefined;

    const call = result.tool_calls[0];
    if (call?.function?.arguments) {
      try {
        const parsed = JSON.parse(call.function.arguments) as {
          refinedPrompt?: string;
          explanation?: string;
        };
        refinedPrompt = (parsed.refinedPrompt ?? "").toString();
        explanation = parsed.explanation?.toString();
      } catch (e) {
        console.error("[refine-prompt] tool_call JSON parse error:", e);
      }
    }
    if (!refinedPrompt && result.content) {
      refinedPrompt = result.content.trim();
    }
    if (!refinedPrompt) {
      return new Response(
        JSON.stringify({ error: "Model returned no content" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        refinedPrompt,
        explanation,
        usage: result.usage,
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
        JSON.stringify({ error: "Rate limit exceeded, please retry shortly." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    // A subclass of GatewayError, so it is checked first. A rewrite that
    // stopped halfway never reaches the dialog's Save button.
    if (error instanceof OutputTruncatedError) {
      return new Response(
        JSON.stringify({ error: error.message, code: "output_truncated" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (error instanceof GatewayError) {
      console.error(
        "[refine-prompt] Gateway error:",
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
    const message = error instanceof Error ? error.message : "Unknown error";
    if (
      message === "Missing Authorization bearer token" ||
      message === "Invalid auth token" ||
      message === "Empty bearer token"
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("[refine-prompt] Error:", message);
    return new Response(JSON.stringify({ error: "Failed to refine prompt" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
