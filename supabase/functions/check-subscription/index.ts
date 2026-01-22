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

// Product IDs for premium plan (both live and sandbox)
const PREMIUM_PRODUCTS = [
  // Live
  "prod_TpqhlvF6bKNQIk",
  "prod_Tpqih5nfN3NUhI",
  // Sandbox
  "prod_Tpqq1Ng9whtnlI",
  "prod_Tpqqzh9Ejs24xh",
];

// Admin-controlled sources - when set, DO NOT update the database
// The admin has explicitly set this and it should persist until manually changed
const ADMIN_CONTROLLED_SOURCES = ["internal", "gifted", "test"];

interface StripeCheckResult {
  hasActiveSub: boolean;
  mode: string;
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
    return { hasActiveSub: false, mode, reason: "no_customer" };
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
    return { hasActiveSub: false, mode, customerId, reason: "no_active_subscription" };
  }

  const subscription = subscriptions.data[0];
  const productId = subscription.items.data[0]?.price?.product as string;
  
  // Safely parse subscription end date
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
    mode,
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get current profile to check for admin override
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("plan_type, plan_source")
      .eq("id", user.id)
      .single();
    
    logStep("Current profile", { 
      planType: profileData?.plan_type, 
      planSource: profileData?.plan_source 
    });

    // CRITICAL: If plan_source is admin-controlled, return current values WITHOUT updating
    // This ensures admin overrides persist and aren't overwritten by Stripe sync
    if (profileData?.plan_source && ADMIN_CONTROLLED_SOURCES.includes(profileData.plan_source)) {
      logStep("Admin override active - returning current profile without Stripe check", { 
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

    // No admin override - check Stripe
    const liveKey = Deno.env.get("STRIPE_SECRET_KEY");
    const sandboxKey = Deno.env.get("STRIPE_SANDBOX_SECRET_KEY");
    
    logStep("Checking Stripe accounts", { 
      hasLiveKey: !!liveKey, 
      hasSandboxKey: !!sandboxKey 
    });

    const checkPromises: Promise<StripeCheckResult>[] = [];
    
    if (liveKey) {
      checkPromises.push(checkStripeAccount(user.email, liveKey, "live"));
    }
    if (sandboxKey) {
      checkPromises.push(checkStripeAccount(user.email, sandboxKey, "sandbox"));
    }

    let activeSubscription: StripeCheckResult | null = null;
    
    if (checkPromises.length > 0) {
      const results = await Promise.allSettled(checkPromises);
      
      for (const result of results) {
        if (result.status === "fulfilled") {
          const checkResult = result.value;
          logStep(`Stripe ${checkResult.mode} result`, { 
            hasActiveSub: checkResult.hasActiveSub, 
            productId: checkResult.productId,
            reason: checkResult.reason
          });
          
          // Found an active subscription with a premium product
          if (checkResult.hasActiveSub && PREMIUM_PRODUCTS.includes(checkResult.productId || "")) {
            activeSubscription = checkResult;
            logStep("Found premium subscription", { 
              mode: checkResult.mode, 
              productId: checkResult.productId 
            });
            break;
          }
        } else {
          logStep("Stripe check failed", { error: String(result.reason) });
        }
      }
    }

    // Determine final plan based on Stripe result
    let planType: string;
    let planSource: string | null;

    if (activeSubscription) {
      planType = "premium";
      planSource = "stripe";
      logStep("Setting premium from active Stripe subscription", { mode: activeSubscription.mode });
    } else {
      planType = "free";
      planSource = null;
      logStep("No active Stripe subscription found, setting to free");
    }

    // Update profile with subscription status
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
      subscribed: planType === "premium",
      plan_type: planType,
      plan_source: planSource,
      product_id: activeSubscription?.productId || null,
      subscription_end: activeSubscription?.subscriptionEnd || null,
      mode: activeSubscription?.mode || null,
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
