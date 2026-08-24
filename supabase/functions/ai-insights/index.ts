import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  DEFAULT_MODEL,
} from "../_shared/llm.ts";
import { SYSTEM_PROMPTS } from "../_shared/prompts/ai-insights.ts";

type ItemType = "prompt" | "skill" | "workflow" | "prompt_kit";

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user_id = await getCallerUserId(req);
    const body = await req.json();
    const { item_type, title, description, content, tags } = body ?? {};

    if (
      !item_type ||
      !["prompt", "skill", "workflow", "prompt_kit"].includes(item_type)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Valid item_type is required (prompt, skill, workflow, prompt_kit)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
    const tagsLine =
      Array.isArray(tags) && tags.length > 0
        ? `Tags: ${tags.join(", ")}\n`
        : "";
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
      return new Response(
        JSON.stringify({ error: "Model returned empty response" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, please retry shortly." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (error instanceof GatewayError) {
      console.error(
        "[ai-insights] Gateway error:",
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
    console.error("[ai-insights] Error:", message);
    return new Response(
      JSON.stringify({ error: "Failed to generate insights" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
