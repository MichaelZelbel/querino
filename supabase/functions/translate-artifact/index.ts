import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      artifactType,
      title,
      description,
      content,
      tags,
      sourceLanguage,
      targetLanguage,
    } = await req.json();

    if (!targetLanguage || !sourceLanguage) {
      return new Response(
        JSON.stringify({ error: "sourceLanguage and targetLanguage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Provider abstraction: default to "lovable", can be switched to "n8n"
    const provider = Deno.env.get("TRANSLATION_PROVIDER") || "lovable";

    if (provider === "n8n") {
      // Proxy to n8n webhook
      const n8nBaseUrl = Deno.env.get("N8N_BASE_URL");
      const n8nWebhookKey = Deno.env.get("N8N_WEBHOOK_KEY");

      if (!n8nBaseUrl) {
        return new Response(
          JSON.stringify({ error: "N8N_BASE_URL not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const n8nResponse = await fetch(`${n8nBaseUrl}/webhook/translate-artifact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nWebhookKey ? { "X-API-Key": n8nWebhookKey } : {}),
        },
        body: JSON.stringify({
          artifactType,
          title,
          description,
          content,
          tags,
          sourceLanguage,
          targetLanguage,
        }),
      });

      if (!n8nResponse.ok) {
        const errText = await n8nResponse.text();
        console.error("n8n error:", n8nResponse.status, errText);
        return new Response(
          JSON.stringify({ error: "Translation failed via n8n" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const n8nData = await n8nResponse.json();
      // n8n returns [{ output: { ... } }] format
      const result = Array.isArray(n8nData) ? n8nData[0]?.output || n8nData[0] : n8nData;

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a professional translator. Translate the following ${artifactType || "artifact"} from ${sourceLanguage} to ${targetLanguage}.

Rules:
- Preserve all markdown formatting, structure, and syntax
- Preserve template variables like {{variable}} exactly as-is
- Translate tags contextually (they are short keywords/phrases)
- Keep code blocks, URLs, and technical identifiers untranslated
- Return the translation using the translate_artifact tool`;

    const userPrompt = `Title: ${title || ""}
Description: ${description || ""}
Content:
${content || ""}
Tags: ${(tags || []).join(", ")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "translate_artifact",
              description: "Return the translated artifact fields",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Translated title" },
                  description: { type: "string", description: "Translated description" },
                  content: { type: "string", description: "Translated content (preserve markdown)" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Translated tags",
                  },
                },
                required: ["title", "description", "content", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "translate_artifact" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Translation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Extract tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Translation failed: unexpected AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let translated: Record<string, unknown>;
    try {
      translated = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Translation failed: could not parse response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(translated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translate-artifact error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
