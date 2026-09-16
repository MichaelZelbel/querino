import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { deleteUserRows } from "../_shared/deleteUserData.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  userId: string;
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
    console.log("v3 - Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("v3 - No valid authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Extract the JWT token from the header
    const token = authHeader.replace("Bearer ", "");

    // Create admin client for all privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Cryptographically verify the JWT via Supabase (uses JWKS).
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      console.error("v4 - JWT verification failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const requestingUserId = authData.user.id;
    console.log("v4 - Requesting user ID verified:", requestingUserId);

    // Check if requesting user is admin. user_roles (via is_admin RPC) is
    // the authoritative role source — profiles.role can drift.
    const { data: isAdminData, error: adminError } = await supabaseAdmin.rpc(
      "is_admin",
      { _user_id: requestingUserId },
    );

    if (adminError || !isAdminData) {
      console.error("v4 - User is not admin:", adminError?.message);
      return new Response(
        JSON.stringify({ error: "Only admins can delete users" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Get the user ID to delete
    const { userId }: DeleteUserRequest = await req.json();
    console.log("v3 - User ID to delete:", userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // The user's rows first, the same sequence delete-my-account runs. Until
    // 2026-09-16 this function deleted only the auth user and trusted the
    // cascades, but prompts, prompt kits and blog posts are ON DELETE SET
    // NULL and the GitHub sync tables have no foreign key at all, so the
    // deleted user's public artifacts stayed live with no author and their
    // sync rows lingered. A failure here keeps the auth user, so the admin
    // can retry and nothing is half gone.
    try {
      const summary = await deleteUserRows(supabaseAdmin, userId);
      console.log("v5 - Rows removed:", JSON.stringify(summary));
    } catch (rowsError) {
      const message =
        rowsError instanceof Error ? rowsError.message : String(rowsError);
      console.error("v5 - Row deletion failed, auth user kept:", message);
      return new Response(
        JSON.stringify({ error: `Failed to delete user: ${message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Then the auth user itself.
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("v3 - Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({
          error: `Failed to delete user: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    console.log(
      `v3 - User ${userId} deleted successfully by admin ${requestingUserId}`,
    );

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("v3 - Error in delete-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
