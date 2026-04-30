import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  DEFAULT_MODEL,
  type ToolDefinition,
} from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior prompt engineer for Querino. \
Your job is to rewrite user prompts according to best practices: \
clear context, explicit goal, well-structured sections, no ambiguity, no fluff. \
If a framework is given (e.g. RISEN, CRISPE, RTF, CO-STAR), structure the rewrite to follow it. \
Always preserve the user's intent and domain.`;

const REFINE_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "return_refined_prompt",
    description: "Return the rewritten production-grade prompt and a short explanation of the changes.",
    parameters: {
      type: "object",
      properties: {
        refinedPrompt: {
          type: "string",
          description: "The rewritten, production-grade prompt. No commentary, no markdown fences.",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth: derive user_id from JWT (never trust body)
    const user_id = await getCallerUserId(req);

    // 2. Parse + validate body
    const body = (await req.json()) as RefineBody;
    const prompt = (body.prompt ?? "").toString().trim();
    const framework = (body.framework ?? "auto").toString().slice(0, 64);
    const goal = (body.goal ?? "").toString().slice(0, 500);

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      tools: [REFINE_TOOL],
      tool_choice: { type: "function", function: { name: "return_refined_prompt" } },
      metadata: { framework, goal_length: goal.length, prompt_length: prompt.length },
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
      return new Response(JSON.stringify({ error: "Model returned no content" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please retry shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error instanceof GatewayError) {
      console.error("[refine-prompt] Gateway error:", error.status, error.message);
      return new Response(JSON.stringify({ error: "Upstream AI gateway error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Missing Authorization bearer token" || message === "Invalid auth token" || message === "Empty bearer token") {
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
