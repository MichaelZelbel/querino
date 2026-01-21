import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    console.log("Webhook received, signature present:", !!signature);

    // Determine which mode based on the event (we'll check the livemode field)
    // For now, try test key first, then live key
    const testStripe = new Stripe(Deno.env.get("STRIPE_TEST_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });
    
    const liveStripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Parse the event without verification first to check livemode
    const rawEvent = JSON.parse(body);
    const isLiveMode = rawEvent.livemode === true;
    
    console.log("Event livemode:", isLiveMode);
    
    const stripe = isLiveMode ? liveStripe : testStripe;
    const event = rawEvent as Stripe.Event;

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log("Processing event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);
        
        const userId = session.metadata?.supabase_user_id;
        if (!userId) {
          console.error("No user ID in session metadata");
          break;
        }

        // Update user profile to premium
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            plan_type: "premium",
            plan_source: `stripe_${isLiveMode ? "live" : "test"}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          throw updateError;
        }

        console.log("User upgraded to premium:", userId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id, "Status:", subscription.status);
        
        // Get customer to find user
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) break;

        const userId = customer.metadata?.supabase_user_id;
        if (!userId) {
          console.log("No user ID in customer metadata, searching by email");
          // Try to find user by email
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("id", customer.email)
            .single();
          
          if (!profile) {
            console.error("Could not find user for customer:", customer.id);
            break;
          }
        }

        // Update based on subscription status
        const isActive = ["active", "trialing"].includes(subscription.status);
        
        if (userId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              plan_type: isActive ? "premium" : "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) console.error("Error updating subscription status:", error);
          else console.log("Subscription status updated for user:", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) break;

        const userId = customer.metadata?.supabase_user_id;
        if (userId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              plan_type: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) console.error("Error downgrading user:", error);
          else console.log("User downgraded to free:", userId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id);
        // Could send notification to user here
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
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
