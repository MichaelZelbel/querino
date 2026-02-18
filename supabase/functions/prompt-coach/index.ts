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
    const body = await req.json();

    const N8N_PROMPT_COACH_URL =
      Deno.env.get("N8N_PROMPT_COACH_URL") ||
      "https://agentpool.app.n8n.cloud/webhook/prompt-coach";
    const N8N_WEBHOOK_KEY = Deno.env.get("N8N_WEBHOOK_KEY") || "";

    const response = await fetch(N8N_PROMPT_COACH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": N8N_WEBHOOK_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[prompt-coach] n8n error:", response.status, text.slice(0, 200));
      return new Response(
        JSON.stringify({ error: `Upstream error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[prompt-coach] Error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Prompt Coach failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
