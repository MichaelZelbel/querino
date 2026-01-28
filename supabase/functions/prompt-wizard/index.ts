import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const N8N_WEBHOOK_URL = "https://agentpool.app.n8n.cloud/webhook/prompt-wizard";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": Deno.env.get("N8N_WEBHOOK_KEY") || "",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    
    let promptText = text.trim();
    
    // Parse JSON if needed: [{ output: "..." }] -> "..."
    if (promptText.startsWith("[") || promptText.startsWith("{")) {
      try {
        let parsed = JSON.parse(promptText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed = parsed[0];
        }
        if (parsed && typeof parsed === "object" && parsed.output) {
          promptText = parsed.output;
        }
      } catch {
        // Keep as-is
      }
    }

    return new Response(JSON.stringify({ prompt: promptText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

