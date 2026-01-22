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

// Product IDs for plan type mapping (both live and sandbox)
const PREMIUM_PRODUCTS = [
  // Live
  "prod_TpqhlvF6bKNQIk",
  "prod_Tpqih5nfN3NUhI",
  // Sandbox
  "prod_Tpqq1Ng9whtnlI",
  "prod_Tpqqzh9Ejs24xh",
];

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

    // Check both live and sandbox Stripe accounts
    const liveKey = Deno.env.get("STRIPE_SECRET_KEY");
    const sandboxKey = Deno.env.get("STRIPE_SANDBOX_SECRET_KEY");
    
    logStep("Checking Stripe accounts", { 
      hasLiveKey: !!liveKey, 
      hasSandboxKey: !!sandboxKey 
    });

    const checkPromises: Promise<StripeCheckResult>[] = [];
    
    if (liveKey) {
      checkPromises.push(checkStripeAccount(user.email, liveKey, "live"));
    } else {
      checkPromises.push(Promise.resolve({ hasActiveSub: false, mode: "live", reason: "no_key" } as StripeCheckResult));
    }
    
    if (sandboxKey) {
      checkPromises.push(checkStripeAccount(user.email, sandboxKey, "sandbox"));
    } else {
      checkPromises.push(Promise.resolve({ hasActiveSub: false, mode: "sandbox", reason: "no_key" } as StripeCheckResult));
    }

    const results = await Promise.allSettled(checkPromises);

    let subscription: StripeCheckResult | null = null;
    let planType = "free";
    let planSource: string | null = null;

    for (const result of results) {
      if (result.status === "fulfilled") {
        const checkResult = result.value;
        logStep(`Stripe ${checkResult.mode} check result`, { 
          hasActiveSub: checkResult.hasActiveSub, 
          mode: checkResult.mode,
          reason: checkResult.reason,
          productId: checkResult.productId 
        });
        if (checkResult.hasActiveSub) {
          subscription = checkResult;
          if (PREMIUM_PRODUCTS.includes(subscription.productId || "")) {
            planType = "premium";
            planSource = `stripe_${subscription.mode}`;
            logStep("Found premium subscription", { mode: subscription.mode, productId: subscription.productId });
            break;
          }
        }
      } else {
        const reason = result.reason as Error | undefined;
        logStep(`Stripe check rejected`, { reason: reason?.message || String(result.reason) });
      }
    }

    logStep("Subscription check complete", { planType, planSource });

    // Update profile with subscription status
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ 
        plan_type: planType, 
        plan_source: planSource 
      })
      .eq("id", user.id);

    if (updateError) {
      logStep("Profile update error", { error: updateError.message });
    } else {
      logStep("Profile updated successfully", { planType, planSource });
    }

    return new Response(JSON.stringify({
      subscribed: planType !== "free",
      plan_type: planType,
      product_id: subscription?.productId || null,
      subscription_end: subscription?.subscriptionEnd || null,
      mode: subscription?.mode || null,
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
  
  logStep(`${mode} active subscription found`, { 
    subscriptionId: subscription.id,
    productId,
    currentPeriodEnd: subscription.current_period_end
  });
  
  return {
    hasActiveSub: true,
    mode,
    customerId,
    productId,
    subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  };
}
