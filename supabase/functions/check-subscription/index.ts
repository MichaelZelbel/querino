import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product IDs for premium plan - keyed by mode
const PREMIUM_PRODUCTS = {
  live: [
    "prod_TpqhlvF6bKNQIk",
    "prod_Tpqih5nfN3NUhI",
  ],
  sandbox: [
    "prod_Tpqq1Ng9whtnlI",
    "prod_Tpqqzh9Ejs24xh",
  ],
};

// Roles that are admin-controlled - when set, skip Stripe check entirely
// These users keep their role regardless of Stripe status
const ADMIN_CONTROLLED_ROLES = ["admin", "premium_gift"];

interface StripeCheckResult {
  hasActiveSub: boolean;
  productId?: string;
  subscriptionEnd?: string;
  reason?: string;
  customerId?: string;
}

async function checkStripeAccount(email: string, stripeKey: string, mode: string): Promise<StripeCheckResult> {
  logStep(`Checking ${mode} Stripe`, { email });
  
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  
  const customers = await stripe.customers.list({ email, limit: 1 });
  logStep(`${mode} customer search`, { found: customers.data.length > 0 });

  if (customers.data.length === 0) {
    return { hasActiveSub: false, reason: "no_customer" };
  }

  const customerId = customers.data[0].id;
  logStep(`${mode} found customer`, { customerId });
  
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 10,
  });
  
  logStep(`${mode} subscriptions`, { 
    count: subscriptions.data.length,
    statuses: subscriptions.data.map((s: { status: string }) => s.status)
  });

  if (subscriptions.data.length === 0) {
    return { hasActiveSub: false, customerId, reason: "no_active_subscription" };
  }

  const subscription = subscriptions.data[0];
  const productId = subscription.items.data[0]?.price?.product as string;
  
  let subscriptionEnd: string | undefined;
  try {
    if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    }
  } catch (dateError) {
    logStep(`${mode} date parsing error`, { error: String(dateError) });
  }
  
  logStep(`${mode} active subscription found`, { 
    subscriptionId: subscription.id,
    productId,
    subscriptionEnd
  });
  
  return {
    hasActiveSub: true,
    customerId,
    productId,
    subscriptionEnd,
  };
}

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
    logStep("Function started");

    // Parse request body to get the mode
    let requestedMode: "live" | "sandbox" = "live";
    try {
      const body = await req.json();
      if (body.mode === "sandbox" || body.mode === "live") {
        requestedMode = body.mode;
      }
    } catch {
      // No body or invalid JSON - use default
    }
    logStep("Requested mode", { mode: requestedMode });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

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
    logStep("Current role", { role: currentRole });

    // If role is admin-controlled, return current values WITHOUT checking Stripe
    // Admin and premium_gift users keep their status regardless of Stripe
    if (ADMIN_CONTROLLED_ROLES.includes(currentRole)) {
      logStep("Admin-controlled role - skipping Stripe check", { role: currentRole });
      
      const isPremium = currentRole === "admin" || currentRole === "premium_gift";
      
      return new Response(JSON.stringify({
        subscribed: isPremium,
        role: currentRole,
        plan_type: isPremium ? "premium" : "free", // Legacy field for compatibility
        plan_source: currentRole === "admin" ? "admin" : "gift", // Legacy field
        product_id: null,
        subscription_end: null,
        mode: null,
        admin_override: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check ONLY the requested Stripe environment
    const stripeKey = requestedMode === "sandbox" 
      ? Deno.env.get("STRIPE_SANDBOX_SECRET_KEY")
      : Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeKey) {
      logStep("Stripe key not configured for mode", { mode: requestedMode });
      return new Response(JSON.stringify({
        subscribed: false,
        role: "free",
        plan_type: "free",
        plan_source: null,
        product_id: null,
        subscription_end: null,
        mode: requestedMode,
        error: `Stripe ${requestedMode} key not configured`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Checking Stripe", { mode: requestedMode });

    const checkResult = await checkStripeAccount(user.email, stripeKey, requestedMode);
    
    logStep("Stripe check result", { 
      hasActiveSub: checkResult.hasActiveSub, 
      productId: checkResult.productId,
      reason: checkResult.reason
    });

    // Determine plan based on Stripe result for THIS mode only
    const validProducts = PREMIUM_PRODUCTS[requestedMode];
    const isPremium = checkResult.hasActiveSub && 
                      checkResult.productId && 
                      validProducts.includes(checkResult.productId);

    const newRole = isPremium ? "premium" : "free";

    logStep("Role determined", { 
      newRole, 
      mode: requestedMode,
      isPremium,
      productId: checkResult.productId
    });

    // Update user_roles table (the authoritative source)
    const { error: updateError } = await supabaseClient
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Role update error", { error: updateError.message });
    } else {
      logStep("Role updated", { role: newRole });
    }

    return new Response(JSON.stringify({
      subscribed: isPremium,
      role: newRole,
      plan_type: newRole === "premium" ? "premium" : "free", // Legacy field
      plan_source: isPremium ? "stripe" : null, // Legacy field
      product_id: checkResult.productId || null,
      subscription_end: checkResult.subscriptionEnd || null,
      mode: requestedMode,
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
