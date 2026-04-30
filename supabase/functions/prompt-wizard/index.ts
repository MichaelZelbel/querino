import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertCredits,
  callLovableAI,
  CreditsExhaustedError,
  GatewayError,
  getCallerUserId,
  RateLimitedError,
} from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Querino, an expert prompt engineer. Generate high-quality prompts based on user requirements.

The user will provide a structured briefing with fields like GOAL, FRAMEWORK, TARGET LLM, AUDIENCE, TONE & STYLE, EXPECTED INPUT, DESIRED OUTPUT, CONSTRAINTS, and ADDITIONAL NOTES.

Use the specified framework (CRISPE, RACE, ORACLE, or Simple Instruction). If the framework is "Auto", choose the most suitable one for the goal.

Format your output in clean Markdown with proper line breaks, bold headers, bullet points, and numbered lists where appropriate.

Output ONLY the generated prompt in Markdown format. No meta-commentary, no explanations, no preamble like "Here is your prompt:".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user_id = await getCallerUserId(req);
    const body = await req.json().catch(() => ({}));

    const structuredInput: string = (body?.structured_input ?? "").toString().trim();
    if (!structuredInput) {
      return new Response(JSON.stringify({ error: "structured_input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await assertCredits(user_id);

    // Cap input to avoid runaway prompts.
    const MAX_INPUT = 8000;
    const safeInput = structuredInput.length > MAX_INPUT
      ? structuredInput.slice(0, MAX_INPUT) + "\n[...truncated]"
      : structuredInput;

    const result = await callLovableAI({
      user_id,
      feature: "prompt-wizard",
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a prompt based on these requirements:\n\n${safeInput}\n\nOutput only the generated prompt in Markdown.`,
        },
      ],
      metadata: { source: "kickstart-template" },
    });

    const promptText = (result.content ?? "").trim();
    if (!promptText) {
      return new Response(JSON.stringify({ error: "Empty response from model" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ prompt: promptText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof CreditsExhaustedError) {
      return new Response(JSON.stringify({ error: error.message, code: "credits_exhausted" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error instanceof RateLimitedError) {
      return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error instanceof GatewayError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[prompt-wizard] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
