import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// NOTE: Stripe SDK removed. Subscription status is now determined solely
// from the user_roles table (admin-managed). To re-enable Stripe, restore
// the checkStripeAccount() logic and Stripe SDK import from git history.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started (DB-only mode)");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get current role from user_roles table (the authoritative source)
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    const currentRole = roleData?.role || "free";
    logStep("Role from DB", { role: currentRole });

    const isPremium = currentRole === "premium" || currentRole === "premium_gift" || currentRole === "admin";

    return new Response(JSON.stringify({
      subscribed: isPremium,
      role: currentRole,
      plan_type: isPremium ? "premium" : "free",
      plan_source: currentRole === "admin" ? "admin" : (currentRole === "premium_gift" ? "gift" : (isPremium ? "stripe" : null)),
      product_id: null,
      subscription_end: null,
      mode: null,
      admin_override: currentRole === "admin" || currentRole === "premium_gift",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
