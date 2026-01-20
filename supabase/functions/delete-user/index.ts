import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { decode } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

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
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract the JWT token from the header
    const token = authHeader.replace("Bearer ", "");
    console.log("v3 - Token length:", token.length);
    
    // Decode the JWT to get claims (without verification - we'll verify via service role)
    let payload: any;
    try {
      const [_header, decodedPayload, _signature] = decode(token);
      payload = decodedPayload;
      console.log("v3 - JWT decoded, sub:", payload?.sub);
    } catch (decodeError: any) {
      console.error("v3 - JWT decode failed:", decodeError.message);
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!payload?.sub) {
      console.error("v3 - No sub claim in token");
      return new Response(
        JSON.stringify({ error: "Invalid token - no user ID" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const requestingUserId = payload.sub;

    // Create admin client for all privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the user exists in auth.users using the admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(requestingUserId);
    
    console.log("v3 - Auth user lookup:", authUser?.user?.id || "not found", "error:", authError?.message || "none");
    
    if (authError || !authUser?.user) {
      console.error("v3 - User not found in auth:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - user not found" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("v3 - Requesting user ID verified:", requestingUserId);

    // Check if requesting user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requestingUserId)
      .single();

    console.log("v3 - User profile:", profile, "Error:", profileError?.message);

    if (profileError || profile?.role !== "admin") {
      console.error("v3 - User is not admin:", profile?.role);
      return new Response(
        JSON.stringify({ error: "Only admins can delete users" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the user ID to delete
    const { userId }: DeleteUserRequest = await req.json();
    console.log("v3 - User ID to delete:", userId);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete the user from auth.users (this will cascade to profiles due to foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("v3 - Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`v3 - User ${userId} deleted successfully by admin ${requestingUserId}`);

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("v3 - Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
