import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { deleteUserRows } from "../_shared/deleteUserData.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Stripe is not part of deleting an account. Until 2026-09-30 this function
// cancelled every subscription and deleted every Stripe customer that shared
// the user's email, with the live key, although Querino has sold nothing since
// checkout was switched off in February 2026. If that Stripe account served
// anything else, deleting a Querino account would have cancelled it. Querino has
// no payment path (see CLAUDE.md), so there is nothing here to clean up.

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
      console.error(
        "delete-my-account - No valid authorization header provided",
      );
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
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
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    // Get the current user from the token
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      console.error(
        "delete-my-account - User verification failed:",
        userError?.message,
      );
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    // The id is enough to trace a deletion; an email does not belong in logs.
    console.log("delete-my-account - Deleting account for user:", userId);

    // Parse request body for confirmation
    const { confirmation } = await req.json();

    if (confirmation !== "DELETE") {
      return new Response(
        JSON.stringify({
          error: "Invalid confirmation. Type DELETE to confirm.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Get user's display name before deletion for the notification
    let displayName: string | null = null;
    try {
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      displayName = profileData?.display_name || null;
    } catch (e) {
      console.log("delete-my-account - Could not fetch display name:", e);
    }

    // Every row the user owns, in an order the foreign keys accept. The
    // sequence lives in _shared/deleteUserData.ts since 2026-09-16 so that
    // delete-user (the admin path) runs exactly the same one; before that it
    // called auth.admin.deleteUser alone and left the user's public prompts
    // and kits live with no author. The first failing delete throws, which
    // the catch below turns into a 500, and the auth user is kept so the
    // account is never gutted but still able to log in.
    console.log("delete-my-account - Deleting user rows...");
    const summary = await deleteUserRows(supabaseAdmin, userId);
    console.log("delete-my-account - Rows removed:", JSON.stringify(summary));

    // Finally, delete the auth user
    console.log("delete-my-account - Deleting auth user...");
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(
        "delete-my-account - Error deleting auth user:",
        deleteError,
      );
      return new Response(
        JSON.stringify({
          error: `Failed to delete account: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    console.log(`delete-my-account - User ${userId} deleted successfully`);

    // Only now, with the auth user really gone. Sending this first meant a run
    // that failed halfway still reported the account as deleted.
    try {
      const notifyResponse = await fetch(
        `${supabaseUrl}/functions/v1/notify-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            eventType: "delete_account",
            userEmail,
            userId,
            displayName,
          }),
        },
      );
      console.log(
        "delete-my-account - Admin notification sent:",
        notifyResponse.status,
      );
    } catch (notifyError) {
      console.error(
        "delete-my-account - Failed to send admin notification:",
        notifyError,
      );
      // The account is already deleted; a missing notification does not undo it.
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("delete-my-account - Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
