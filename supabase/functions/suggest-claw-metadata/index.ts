import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claw_content, user_id } = await req.json();

    if (!claw_content || typeof claw_content !== "string") {
      return new Response(
        JSON.stringify({ error: "claw_content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calling n8n webhook for claw metadata, content length:", claw_content.length, "user_id:", user_id);

    const response = await fetch("https://agentpool.app.n8n.cloud/webhook/suggest-claw-metadata", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": Deno.env.get("N8N_WEBHOOK_KEY") || "",
      },
      body: JSON.stringify({ claw_content, user_id }),
    });

    if (!response.ok) {
      console.error("Webhook error:", response.status, response.statusText);
      throw new Error(`Webhook returned ${response.status}`);
    }

    const rawResult = await response.json();
    console.log("Raw webhook response:", JSON.stringify(rawResult));

    // Handle the n8n response format: [{ output: { title, description, category, tags } }]
    let result;
    if (Array.isArray(rawResult) && rawResult.length > 0 && rawResult[0].output) {
      result = rawResult[0].output;
    } else if (rawResult.output) {
      result = rawResult.output;
    } else {
      result = rawResult;
    }

    console.log("Parsed result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calling suggest-claw-metadata webhook:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate suggestions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
