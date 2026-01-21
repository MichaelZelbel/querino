import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
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
    const results = await Promise.allSettled([
      checkStripeAccount(user.email, Deno.env.get("STRIPE_SECRET_KEY"), "live"),
      checkStripeAccount(user.email, Deno.env.get("STRIPE_SANDBOX_SECRET_KEY"), "sandbox"),
    ]);

    let subscription = null;
    let planType = "free";
    let planSource: string | null = null;

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.hasActiveSub) {
        subscription = result.value;
        if (PREMIUM_PRODUCTS.includes(subscription.productId || "")) {
          planType = "premium";
          planSource = `stripe_${subscription.mode}`;
        }
        break;
      }
    }

    logStep("Subscription check complete", { planType, planSource });

    // Update profile with subscription status
    await supabaseClient
      .from("profiles")
      .update({ 
        plan_type: planType, 
        plan_source: planSource 
      })
      .eq("id", user.id);

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

async function checkStripeAccount(email: string, stripeKey: string | undefined, mode: string) {
  if (!stripeKey) {
    return { hasActiveSub: false, mode };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const customers = await stripe.customers.list({ email, limit: 1 });

  if (customers.data.length === 0) {
    return { hasActiveSub: false, mode };
  }

  const customerId = customers.data[0].id;
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return { hasActiveSub: false, mode };
  }

  const subscription = subscriptions.data[0];
  return {
    hasActiveSub: true,
    mode,
    productId: subscription.items.data[0].price.product as string,
    subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  };
}
