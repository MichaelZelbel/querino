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

    const N8N_WORKFLOW_COACH_URL =
      Deno.env.get("N8N_WORKFLOW_COACH_URL") ||
      "https://agentpool.app.n8n.cloud/webhook/workflow-coach";
    const N8N_WEBHOOK_KEY = Deno.env.get("N8N_WEBHOOK_KEY") || "";

    const response = await fetch(N8N_WORKFLOW_COACH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": N8N_WEBHOOK_KEY,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("[workflow-coach] n8n error:", response.status, text.slice(0, 200));
      return new Response(
        JSON.stringify({ error: `Upstream error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!text || text.trim() === "") {
      console.error("[workflow-coach] n8n returned empty body");
      return new Response(
        JSON.stringify({ error: "Upstream returned empty response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("[workflow-coach] JSON parse error:", parseErr, "body:", text.slice(0, 200));
      return new Response(
        JSON.stringify({ error: "Upstream returned invalid JSON" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(data as Record<string, unknown>), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[workflow-coach] Error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Workflow Coach failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
