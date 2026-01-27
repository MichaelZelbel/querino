import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://n8n-querino.agentpool.cloud/webhook/querino-prompt-refinement";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, framework, goal, user_id } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[REFINE-PROMPT] Calling n8n webhook", {
      promptLength: prompt.length,
      framework,
      goal: goal?.substring(0, 50),
      user_id,
    });

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, framework, goal, user_id }),
    });

    if (!response.ok) {
      console.error("[REFINE-PROMPT] Webhook error:", response.status, response.statusText);
      throw new Error(`Webhook returned ${response.status}`);
    }

    // Handle both JSON and plain text responses
    const responseText = await response.text();
    console.log("[REFINE-PROMPT] Raw response length:", responseText.length);

    let result: { refinedPrompt: string; explanation?: string };

    try {
      const rawResult = JSON.parse(responseText);
      console.log("[REFINE-PROMPT] Parsed JSON response");

      // Handle n8n response format: [{ output: { refinedPrompt, explanation } }] or similar
      if (Array.isArray(rawResult) && rawResult.length > 0) {
        const firstItem = rawResult[0];
        if (firstItem.output) {
          result = {
            refinedPrompt: firstItem.output.refinedPrompt || firstItem.output.prompt || firstItem.output,
            explanation: firstItem.output.explanation,
          };
        } else {
          result = {
            refinedPrompt: firstItem.refinedPrompt || firstItem.prompt || JSON.stringify(firstItem),
            explanation: firstItem.explanation,
          };
        }
      } else if (rawResult.output) {
        result = {
          refinedPrompt: rawResult.output.refinedPrompt || rawResult.output.prompt || rawResult.output,
          explanation: rawResult.output.explanation,
        };
      } else if (rawResult.refinedPrompt || rawResult.prompt) {
        result = {
          refinedPrompt: rawResult.refinedPrompt || rawResult.prompt,
          explanation: rawResult.explanation,
        };
      } else {
        result = { refinedPrompt: JSON.stringify(rawResult) };
      }
    } catch {
      // If not valid JSON, treat as plain text prompt
      console.log("[REFINE-PROMPT] Response is plain text");
      result = { refinedPrompt: responseText.trim() };
    }

    // Ensure refinedPrompt is a string
    if (typeof result.refinedPrompt !== "string") {
      result.refinedPrompt = String(result.refinedPrompt);
    }

    console.log("[REFINE-PROMPT] Success - refined prompt length:", result.refinedPrompt.length);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[REFINE-PROMPT] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to refine prompt" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
