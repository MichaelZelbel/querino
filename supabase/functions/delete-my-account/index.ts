import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Cancel all active Stripe subscriptions for a given email
async function cancelStripeSubscriptions(email: string): Promise<void> {
  const stripeKeys = [
    { key: Deno.env.get("STRIPE_SECRET_KEY"), mode: "live" },
    { key: Deno.env.get("STRIPE_SANDBOX_SECRET_KEY"), mode: "sandbox" },
  ];

  for (const { key, mode } of stripeKeys) {
    if (!key) {
      console.log(`delete-my-account - Stripe ${mode} key not configured, skipping`);
      continue;
    }

    try {
      const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
      
      // Find customer by email
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length === 0) {
        console.log(`delete-my-account - No Stripe ${mode} customer found for ${email}`);
        continue;
      }

      const customerId = customers.data[0].id;
      console.log(`delete-my-account - Found Stripe ${mode} customer: ${customerId}`);

      // Get all active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 100,
      });

      console.log(`delete-my-account - Found ${subscriptions.data.length} active ${mode} subscriptions`);

      // Cancel each subscription
      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.cancel(subscription.id);
        console.log(`delete-my-account - Cancelled ${mode} subscription: ${subscription.id}`);
      }

      // Optionally delete the Stripe customer to remove all payment data
      await stripe.customers.del(customerId);
      console.log(`delete-my-account - Deleted Stripe ${mode} customer: ${customerId}`);
    } catch (error) {
      console.error(`delete-my-account - Error handling Stripe ${mode}:`, error);
      // Continue with deletion even if Stripe fails - log the error but don't block
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Get the Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("delete-my-account - Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("delete-my-account - No valid authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user client to verify the token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get the current user from the token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error("delete-my-account - User verification failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    console.log("delete-my-account - Deleting account for user:", userId, userEmail);

    // Parse request body for confirmation
    const { confirmation } = await req.json();
    
    if (confirmation !== "DELETE") {
      return new Response(
        JSON.stringify({ error: "Invalid confirmation. Type DELETE to confirm." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Cancel Stripe subscriptions first (before deleting any data)
    if (userEmail) {
      console.log("delete-my-account - Cancelling Stripe subscriptions...");
      await cancelStripeSubscriptions(userEmail);
    }

    // Delete user data from all tables (in order to respect foreign keys)
    // The order matters to avoid FK constraint violations
    
    console.log("delete-my-account - Deleting user credentials...");
    await supabaseAdmin.from("user_credentials").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting user saved prompts...");
    await supabaseAdmin.from("user_saved_prompts").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting prompt pins...");
    await supabaseAdmin.from("prompt_pins").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting prompt reviews...");
    await supabaseAdmin.from("prompt_reviews").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting skill reviews...");
    await supabaseAdmin.from("skill_reviews").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting workflow reviews...");
    await supabaseAdmin.from("workflow_reviews").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting comments...");
    await supabaseAdmin.from("comments").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting suggestions authored...");
    await supabaseAdmin.from("suggestions").delete().eq("author_id", userId);
    
    console.log("delete-my-account - Deleting activity events...");
    await supabaseAdmin.from("activity_events").delete().eq("actor_id", userId);
    
    console.log("delete-my-account - Deleting AI allowance periods...");
    await supabaseAdmin.from("ai_allowance_periods").delete().eq("user_id", userId);
    
    console.log("delete-my-account - Deleting LLM usage events...");
    await supabaseAdmin.from("llm_usage_events").delete().eq("user_id", userId);
    
    // Delete collection items for user's collections first
    console.log("delete-my-account - Fetching user collections...");
    const { data: userCollections } = await supabaseAdmin
      .from("collections")
      .select("id")
      .eq("owner_id", userId);
    
    if (userCollections && userCollections.length > 0) {
      const collectionIds = userCollections.map(c => c.id);
      console.log("delete-my-account - Deleting collection items...");
      await supabaseAdmin.from("collection_items").delete().in("collection_id", collectionIds);
    }
    
    console.log("delete-my-account - Deleting collections...");
    await supabaseAdmin.from("collections").delete().eq("owner_id", userId);
    
    // Delete prompt versions for user's prompts
    console.log("delete-my-account - Fetching user prompts...");
    const { data: userPrompts } = await supabaseAdmin
      .from("prompts")
      .select("id")
      .eq("author_id", userId);
    
    if (userPrompts && userPrompts.length > 0) {
      const promptIds = userPrompts.map(p => p.id);
      console.log("delete-my-account - Deleting prompt versions...");
      await supabaseAdmin.from("prompt_versions").delete().in("prompt_id", promptIds);
      
      // Delete reviews on user's prompts (by others)
      await supabaseAdmin.from("prompt_reviews").delete().in("prompt_id", promptIds);
      
      // Delete AI insights for user's prompts
      for (const promptId of promptIds) {
        await supabaseAdmin.from("ai_insights").delete()
          .eq("item_type", "prompt")
          .eq("item_id", promptId);
      }
    }
    
    console.log("delete-my-account - Deleting prompts...");
    await supabaseAdmin.from("prompts").delete().eq("author_id", userId);
    
    // Delete AI insights for user's skills
    const { data: userSkills } = await supabaseAdmin
      .from("skills")
      .select("id")
      .eq("author_id", userId);
    
    if (userSkills && userSkills.length > 0) {
      const skillIds = userSkills.map(s => s.id);
      await supabaseAdmin.from("skill_reviews").delete().in("skill_id", skillIds);
      for (const skillId of skillIds) {
        await supabaseAdmin.from("ai_insights").delete()
          .eq("item_type", "skill")
          .eq("item_id", skillId);
      }
    }
    
    console.log("delete-my-account - Deleting skills...");
    await supabaseAdmin.from("skills").delete().eq("author_id", userId);
    
    // Delete AI insights for user's workflows
    const { data: userWorkflows } = await supabaseAdmin
      .from("workflows")
      .select("id")
      .eq("author_id", userId);
    
    if (userWorkflows && userWorkflows.length > 0) {
      const workflowIds = userWorkflows.map(w => w.id);
      await supabaseAdmin.from("workflow_reviews").delete().in("workflow_id", workflowIds);
      for (const workflowId of workflowIds) {
        await supabaseAdmin.from("ai_insights").delete()
          .eq("item_type", "workflow")
          .eq("item_id", workflowId);
      }
    }
    
    console.log("delete-my-account - Deleting workflows...");
    await supabaseAdmin.from("workflows").delete().eq("author_id", userId);
    
    // Handle team ownership - transfer or delete teams
    console.log("delete-my-account - Handling team memberships...");
    await supabaseAdmin.from("team_members").delete().eq("user_id", userId);
    
    // Delete teams owned by user (members already deleted above)
    console.log("delete-my-account - Deleting owned teams...");
    await supabaseAdmin.from("teams").delete().eq("owner_id", userId);
    
    // Delete the profile
    console.log("delete-my-account - Deleting profile...");
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    
    // Finally, delete the auth user
    console.log("delete-my-account - Deleting auth user...");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("delete-my-account - Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: `Failed to delete account: ${deleteError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`delete-my-account - User ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("delete-my-account - Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
