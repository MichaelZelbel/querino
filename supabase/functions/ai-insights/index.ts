import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { item_type, title, description, content, tags, metadata, user_id } = await req.json();

    if (!content || typeof content !== "string") {
      console.error("[AI-INSIGHTS] Missing content");
      return new Response(
        JSON.stringify({ error: "content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!item_type || !["prompt", "skill", "workflow"].includes(item_type)) {
      console.error("[AI-INSIGHTS] Invalid item_type:", item_type);
      return new Response(
        JSON.stringify({ error: "Valid item_type is required (prompt, skill, workflow)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use specific webhook for prompts, generic for others
    const webhookUrl = item_type === "prompt"
      ? "https://agentpool.app.n8n.cloud/webhook/prompt-insights"
      : "https://agentpool.app.n8n.cloud/webhook/ai-insights";

    console.log("[AI-INSIGHTS] Calling webhook", {
      item_type,
      title,
      contentLength: content.length,
      user_id,
      webhookUrl,
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": Deno.env.get("N8N_WEBHOOK_KEY") || "",
      },
      body: JSON.stringify({
        itemType: item_type,
        title: title || "",
        description: description || "",
        content,
        tags: tags || [],
        metadata: metadata || {},
        user_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-INSIGHTS] Webhook error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Webhook returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawResult = await response.text();
    console.log("[AI-INSIGHTS] Raw response length:", rawResult.length);

    // Try to parse as JSON, fall back to raw text as summary
    let result;
    try {
      const jsonResult = JSON.parse(rawResult);
      
      // Handle n8n webhook format: [{ "output": "..." }] or { "output": "..." }
      if (Array.isArray(jsonResult) && jsonResult[0]?.output) {
        result = jsonResult[0].output;
      } else if (jsonResult.output) {
        result = jsonResult.output;
      } else {
        result = jsonResult;
      }
      
      console.log("[AI-INSIGHTS] Parsed JSON result");
    } catch {
      // Not valid JSON, treat as raw markdown
      result = { summary: rawResult };
      console.log("[AI-INSIGHTS] Using raw text as summary");
    }

    // Normalize result structure
    const normalizedResult = {
      summary: typeof result === "string" ? result : result.summary || null,
      tags: Array.isArray(result.tags) ? result.tags : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      quality: result.quality || null,
    };

    console.log("[AI-INSIGHTS] Success - returning normalized result");

    return new Response(JSON.stringify(normalizedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI-INSIGHTS] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate insights" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
