import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  DEFAULT_MODEL,
} from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ItemType = "prompt" | "skill" | "workflow" | "prompt_kit";

const SYSTEM_PROMPTS: Record<ItemType, string> = {
  prompt: `You are an expert prompt engineer reviewing an AI prompt in the Querino library.
Produce a concise, actionable Markdown analysis for the prompt's author. Be specific, never generic.

Structure your response with these Markdown sections (use ## headings):
## Summary
2–3 sentences explaining what this prompt does and who it's for.
## Strengths
3–5 bullet points highlighting what works well (clarity, structure, role definition, output format, etc.).
## Improvement Suggestions
3–5 bullet points with concrete, actionable fixes (missing context, ambiguity, output constraints, edge cases).
## Best Used With
1–2 sentences on which LLM(s) and use cases fit best.

Keep the whole response under 350 words. No fluff, no marketing tone, no emojis.`,

  skill: `You are an expert in AI Skills (reusable Markdown-based capability definitions following the SKILL.md convention).
Produce a concise Markdown analysis for the skill's author.

Structure with these ## sections:
## Summary
What the skill does and when to invoke it.
## Strengths
3–5 bullets — clear instructions, good examples, well-scoped capability, etc.
## Improvement Suggestions
3–5 bullets with concrete fixes (missing examples, unclear triggers, scope creep, missing edge-case handling).
## Integration Notes
1–2 sentences on how this skill composes with prompts/workflows.

Under 350 words. Specific, never generic. No emojis.`,

  workflow: `You are an expert in n8n / automation workflow design reviewing a workflow definition.
Produce a concise Markdown analysis for the workflow's author.

Structure with these ## sections:
## Summary
What the workflow automates and its trigger.
## Strengths
3–5 bullets — node choices, error handling, modularity, etc.
## Improvement Suggestions
3–5 bullets with concrete fixes (missing error branches, hardcoded values, security concerns, performance).
## Operational Notes
1–2 sentences on credentials, rate limits, or scheduling considerations.

Under 350 words. Specific and technical. No emojis.`,

  prompt_kit: `You are an expert prompt engineer reviewing a Prompt Kit — a single Markdown document that bundles multiple related prompts (each prompt starts with a "## Prompt: <Title>" heading).
Produce a concise Markdown analysis for the kit's author.

Structure with these ## sections:
## Summary
What this kit covers and the use case it bundles together.
## Strengths
3–5 bullets — coverage breadth, prompt clarity, internal consistency, naming.
## Improvement Suggestions
3–5 bullets with concrete fixes (missing prompts, redundant variants, inconsistent style, weak section headers).
## Kit Composition
1–2 sentences on how the included prompts complement each other and any obvious gaps.

Under 350 words. Specific, never generic. No emojis.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user_id = await getCallerUserId(req);
    const body = await req.json();
    const { item_type, title, description, content, tags } = body ?? {};

    if (!item_type || !["prompt", "skill", "workflow", "prompt_kit"].includes(item_type)) {
      return new Response(
        JSON.stringify({ error: "Valid item_type is required (prompt, skill, workflow, prompt_kit)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const contentStr = (content ?? "").toString().trim();
    if (!contentStr) {
      return new Response(JSON.stringify({ error: "content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await assertCredits(user_id);

    const truncated = contentStr.slice(0, 12000);
    const tagsLine = Array.isArray(tags) && tags.length > 0 ? `Tags: ${tags.join(", ")}\n` : "";
    const userMessage = `Title: ${title || "(untitled)"}
Description: ${description || "(none)"}
${tagsLine}
---
Content:
${truncated}`;

    const result = await callLovableAI({
      user_id,
      feature: `ai-insights-${item_type}`,
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[item_type as ItemType] },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
      metadata: { artifact: item_type, content_length: contentStr.length },
    });

    const summary = (result.content ?? "").trim();
    if (!summary) {
      return new Response(JSON.stringify({ error: "Model returned empty response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        summary,
        tags: [],
        recommendations: [],
        quality: null,
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
      console.error("[ai-insights] Gateway error:", error.status, error.message);
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
    console.error("[ai-insights] Error:", message);
    return new Response(JSON.stringify({ error: "Failed to generate insights" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
