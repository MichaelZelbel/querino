import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NOTE: Stripe customer portal is currently disabled. To re-enable, restore
// the Stripe SDK logic and portal session creation from git history.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[CUSTOMER-PORTAL] Function called - currently disabled");

  return new Response(JSON.stringify({ 
    error: "Billing portal is currently disabled. Contact support@querino.ai to manage your subscription." 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 503,
  });
});
