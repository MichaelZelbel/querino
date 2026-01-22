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

// Admin-controlled sources - when set, skip Stripe check entirely
const ADMIN_CONTROLLED_SOURCES = ["internal", "gifted", "test"];

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

    // Get current profile
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("plan_type, plan_source")
      .eq("id", user.id)
      .single();
    
    logStep("Current profile", { 
      planType: profileData?.plan_type, 
      planSource: profileData?.plan_source 
    });

    // If plan_source is admin-controlled, return current values WITHOUT checking Stripe
    if (profileData?.plan_source && ADMIN_CONTROLLED_SOURCES.includes(profileData.plan_source)) {
      logStep("Admin override active - returning current profile", { 
        planType: profileData.plan_type, 
        planSource: profileData.plan_source 
      });
      
      return new Response(JSON.stringify({
        subscribed: profileData.plan_type === "premium",
        plan_type: profileData.plan_type || "free",
        plan_source: profileData.plan_source,
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

    const planType = isPremium ? "premium" : "free";
    const planSource = isPremium ? "stripe" : null;

    logStep("Plan determined", { 
      planType, 
      planSource, 
      mode: requestedMode,
      isPremium,
      productId: checkResult.productId
    });

    // Update profile
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ plan_type: planType, plan_source: planSource })
      .eq("id", user.id);

    if (updateError) {
      logStep("Profile update error", { error: updateError.message });
    } else {
      logStep("Profile updated", { planType, planSource });
    }

    return new Response(JSON.stringify({
      subscribed: isPremium,
      plan_type: planType,
      plan_source: planSource,
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
