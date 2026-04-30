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

const TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "translate_artifact",
    description: "Return the translated artifact fields.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Translated title" },
        description: { type: "string", description: "Translated description" },
        content: { type: "string", description: "Translated content (preserve markdown, code blocks, and {{variables}})" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Translated tags (lowercase, contextual)",
        },
      },
      required: ["title", "description", "content", "tags"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user_id = await getCallerUserId(req);
    const {
      artifactType,
      title,
      description,
      content,
      tags,
      sourceLanguage,
      targetLanguage,
    } = await req.json();

    if (!sourceLanguage || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "sourceLanguage and targetLanguage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (sourceLanguage === targetLanguage) {
      return new Response(
        JSON.stringify({ error: "sourceLanguage and targetLanguage must differ" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await assertCredits(user_id);

    const systemPrompt = `You are a professional translator. Translate the following ${artifactType || "artifact"} from ${sourceLanguage} to ${targetLanguage}.

Rules:
- Preserve all Markdown formatting, headings, lists, and structure exactly.
- Preserve template variables like {{variable}}, [PLACEHOLDER], and $variables exactly as-is — never translate them.
- Preserve code blocks, inline code, URLs, file paths, and technical identifiers untranslated.
- Translate tags contextually (they are short keywords/phrases) into lowercase ${targetLanguage} equivalents.
- Keep the original tone and register (formal/informal).
- Return the result via the translate_artifact tool.`;

    // Truncate content to keep token usage predictable.
    const truncatedContent = (content ?? "").toString().slice(0, 16000);
    const userPrompt = `Title: ${title || ""}
Description: ${description || ""}
Tags: ${(tags || []).join(", ")}
---
Content:
${truncatedContent}`;

    const result = await callLovableAI({
      user_id,
      feature: "translate-artifact",
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "translate_artifact" } },
      temperature: 0.2,
      metadata: {
        artifact: artifactType || "unknown",
        source: sourceLanguage,
        target: targetLanguage,
        content_length: (content ?? "").length,
      },
    });

    const call = result.tool_calls[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Translation returned no result" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: { title?: string; description?: string; content?: string; tags?: string[] };
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch (e) {
      console.error("[translate-artifact] JSON parse error:", e);
      return new Response(JSON.stringify({ error: "Invalid translation response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        title: (parsed.title ?? "").toString(),
        description: (parsed.description ?? "").toString(),
        content: (parsed.content ?? "").toString(),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t)) : [],
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
      console.error("[translate-artifact] Gateway error:", error.status, error.message);
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
    console.error("[translate-artifact] Error:", message);
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
