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

const SYSTEM_PROMPT = `You generate concise metadata for reusable AI Skills (text-based frameworks for prompting) in the Querino library.
A Skill describes a reusable thinking framework, methodology, or technique — not a one-off prompt.

Return:
- A short, descriptive title (max 60 chars), naming the framework or technique.
- A single-sentence description (max 160 chars) explaining what the skill helps you do.
- A single category from this fixed list.
- 3–6 lowercase tags (single words or short kebab-case phrases) describing the domain and technique.

Allowed categories:
- Reasoning
- Writing
- Analysis
- Coding
- Research
- Communication
- Productivity
- Decision Making
- Creative
- Other

Pick the single best-fitting category. Tags must be specific, not generic.`;

const TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "return_metadata",
    description: "Return suggested metadata for the skill.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
      },
      required: ["title", "description", "category", "tags"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user_id = await getCallerUserId(req);
    const body = await req.json();
    const skill_content = (body?.skill_content ?? "").toString().trim();
    if (!skill_content) {
      return new Response(JSON.stringify({ error: "skill_content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await assertCredits(user_id);
    const truncated = skill_content.slice(0, 12000);

    const result = await callLovableAI({
      user_id,
      feature: "suggest-skill-metadata",
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Suggest metadata for this skill:\n\n${truncated}` },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "return_metadata" } },
      metadata: { artifact: "skill", content_length: skill_content.length },
    });

    const call = result.tool_calls[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Model returned no metadata" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: { title?: string; description?: string; category?: string; tags?: string[] };
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch (e) {
      console.error("[suggest-skill-metadata] JSON parse error:", e);
      return new Response(JSON.stringify({ error: "Invalid model response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        title: (parsed.title ?? "").toString().slice(0, 80),
        description: (parsed.description ?? "").toString().slice(0, 200),
        category: (parsed.category ?? "Other").toString(),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6).map((t) => String(t)) : [],
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
      console.error("[suggest-skill-metadata] Gateway error:", error.status, error.message);
      return new Response(JSON.stringify({ error: "Upstream AI gateway error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    console.error("[suggest-skill-metadata] Error:", message);
    return new Response(JSON.stringify({ error: "Failed to generate suggestions" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
