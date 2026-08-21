import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { isAdminCaller, isMachineCaller } from "../_shared/internalAuth.ts";
import { ensureAllowance, type EnsureAllowanceResult } from "../_shared/allowance.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENSURE-TOKEN-ALLOWANCE] ${step}${detailsStr}`);
};

// Everything this function used to compute for itself now lives in the SQL
// function ensure_ai_allowance (finding S4). What is left here is the front
// door: who is allowed to ask, and for whom.
//
// The rule the audit turned into a rule in CLAUDE.md applies twice below: an
// identity is never read from the request body, and force_tokens / period_start
// / period_end / source are administrative overrides that need is_admin even
// when the caller is aiming at their own account (finding C2).

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Parse request body for options
    let body: {
      user_id?: string;
      period_start?: string;
      period_end?: string;
      source?: string;
      force_tokens?: number;
      batch_init?: boolean;
    } = {};

    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - will use auth token
    }

    // Resolve the caller BEFORE dispatching on the body. This function is
    // declared `verify_jwt = false`, so the platform gateway lets anonymous
    // requests through and every branch below has to prove who is calling.
    const bearer = (req.headers.get("Authorization") ?? "")
      .replace(/^Bearer\s+/i, "")
      .trim();

    // If batch_init is true, initialize all users without active periods.
    // This walks every profile, so it must never be reachable by an anonymous
    // caller or an ordinary logged-in user. Three callers are legitimate: the
    // shared job secret, the service-role key, and a signed-in admin, because
    // Admin.tsx runs this on mount to fill its allowance table.
    if (body.batch_init === true) {
      if (!isMachineCaller(req) && !(await isAdminCaller(req))) {
        logStep("Rejected unauthorized batch_init");
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      logStep("Batch initialization requested");

      // Get all users from profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id");

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      let created = 0;
      let skipped = 0;
      let errors = 0;

      for (const profile of profiles || []) {
        try {
          const result = await ensureAllowance(supabaseAdmin, profile.id, {
            createdBy: "ensure-token-allowance:batch_init",
          });
          if (result.created) created++;
          else skipped++;
        } catch (err) {
          errors++;
          // Per-user detail goes to the log, never to the response body: the
          // response previously carried every user id and allowance row.
          logStep("Batch entry failed", {
            userId: profile.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      logStep("Batch initialization complete", { created, skipped, errors });

      return new Response(JSON.stringify({
        success: true,
        summary: { created, skipped, errors },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Single user mode.
    // Always require auth token for non-batch operations
    if (!bearer) {
      throw new Error("No authorization header provided");
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(bearer);

    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message ?? "User not found"}`);
    }

    const authenticatedUserId = userData.user.id;
    logStep("Authenticated user", { userId: authenticatedUserId });

    // period_start, period_end, source and force_tokens decide how many tokens
    // get granted and for how long. They are administrative overrides, so they
    // need an admin even when the caller is only targeting their own account —
    // otherwise any user can mint themselves an unlimited allowance.
    const wantsPrivilegedOptions =
      body.force_tokens !== undefined ||
      body.period_start !== undefined ||
      body.period_end !== undefined ||
      body.source !== undefined;

    const wantsOtherUser = !!body.user_id && body.user_id !== authenticatedUserId;

    if (wantsPrivilegedOptions || wantsOtherUser) {
      logStep("Checking admin privileges", { wantsPrivilegedOptions, wantsOtherUser });

      // user_roles (via is_admin RPC) is the authoritative role source —
      // profiles.role can drift and is not used for authorization.
      const { data: isAdminData, error: adminError } = await supabaseAdmin
        .rpc('is_admin', { _user_id: authenticatedUserId });

      if (adminError || !isAdminData) {
        logStep("Admin check failed", { error: adminError?.message });
        throw new Error(
          wantsOtherUser
            ? "Only admins can specify a different user_id"
            : "Only admins can override period_start, period_end, source or force_tokens",
        );
      }
    }

    const userId = wantsOtherUser ? body.user_id! : authenticatedUserId;
    if (wantsOtherUser) {
      logStep("Admin override: using provided user_id", { userId, adminId: authenticatedUserId });
    }

    // Build options. Only reachable with admin rights (checked above); an
    // ordinary caller lands here with an empty object and gets the plan default.
    const options: {
      periodStart?: Date;
      periodEnd?: Date;
      source?: string;
      forceTokens?: number;
    } = {};

    if (wantsPrivilegedOptions) {
      if (body.period_start) {
        options.periodStart = new Date(body.period_start);
      }
      if (body.period_end) {
        options.periodEnd = new Date(body.period_end);
      }
      if (body.source) {
        options.source = body.source;
      }
      if (body.force_tokens !== undefined) {
        options.forceTokens = body.force_tokens;
      }
    }

    const result: EnsureAllowanceResult = await ensureAllowance(supabaseAdmin, userId, {
      ...options,
      createdBy: "ensure-token-allowance",
    });

    return new Response(JSON.stringify({
      success: true,
      ...result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
