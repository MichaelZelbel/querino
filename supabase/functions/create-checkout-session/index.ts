import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, billingCycle, mode = "sandbox" } = await req.json();
    
    console.log("Creating checkout session:", { priceId, billingCycle, mode });

    // Select the appropriate Stripe key based on mode
    const stripeKey = mode === "live" 
      ? Deno.env.get("STRIPE_SECRET_KEY")
      : Deno.env.get("STRIPE_TEST_SECRET_KEY");

    if (!stripeKey) {
      throw new Error(`Stripe ${mode} key not configured`);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get user from Supabase auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("User authenticated:", user.id, user.email);

    // Check if customer already exists in Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("Created new customer:", customerId);
    }

    // Determine the price based on billing cycle
    // These are placeholder prices - you'll need to create products in Stripe
    // and update these IDs
    let stripePriceId = priceId;
    
    // If no priceId provided, we'll create an inline price for testing
    const lineItems = priceId 
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: "eur",
            product_data: {
              name: "Querino Premium",
              description: billingCycle === "yearly" 
                ? "Annual subscription with 20% discount" 
                : "Monthly subscription",
            },
            unit_amount: billingCycle === "yearly" ? 14400 : 1500, // €144/year or €15/month
            recurring: {
              interval: billingCycle === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        }];

    // Create checkout session
    const origin = req.headers.get("origin") || "https://querino.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      metadata: {
        supabase_user_id: user.id,
        billing_cycle: billingCycle,
        stripe_mode: mode,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
