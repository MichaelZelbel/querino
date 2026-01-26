import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENSURE-TOKEN-ALLOWANCE] ${step}${detailsStr}`);
};

interface AllowanceResult {
  created: boolean;
  allowance: {
    id: string;
    user_id: string;
    period_start: string;
    period_end: string;
    tokens_granted: number;
    tokens_used: number;
    milli_credits_granted: number;
    milli_credits_used: number;
    source: string;
  } | null;
  error?: string;
}

/**
 * Get the current calendar month period boundaries
 * period_start = first day of current month at 00:00 UTC
 * period_end = first day of next month at 00:00 UTC
 */
function getCurrentMonthPeriod(): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
}

/**
 * Fetch the admin-configured token settings
 */
// deno-lint-ignore no-explicit-any
async function getTokenSettings(supabaseAdmin: any): Promise<{
  tokensPerCredit: number;
  creditsFreePerMonth: number;
  creditsPremiumPerMonth: number;
}> {
  const { data, error } = await supabaseAdmin
    .from("ai_credit_settings")
    .select("key, value_int")
    .in("key", ["tokens_per_credit", "credits_free_per_month", "credits_premium_per_month"]);

  if (error) {
    logStep("Error fetching settings", { error: error.message });
    throw new Error(`Failed to fetch token settings: ${error.message}`);
  }

  const settings: Record<string, number> = {};
  // deno-lint-ignore no-explicit-any
  data?.forEach((row: any) => {
    settings[row.key] = row.value_int;
  });

  return {
    tokensPerCredit: settings["tokens_per_credit"] ?? 200,
    creditsFreePerMonth: settings["credits_free_per_month"] ?? 0,
    creditsPremiumPerMonth: settings["credits_premium_per_month"] ?? 1500,
  };
}

/**
 * Get user's plan type from profiles
 */
// deno-lint-ignore no-explicit-any
async function getUserPlanType(
  supabaseAdmin: any,
  userId: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("plan_type")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logStep("Error fetching user plan", { error: error.message, userId });
    return "free";
  }

  return data?.plan_type ?? "free";
}

/**
 * Check if user has an active period (period_start <= now < period_end)
 */
// deno-lint-ignore no-explicit-any
async function getActiveAllowance(
  supabaseAdmin: any,
  userId: string
): Promise<AllowanceResult["allowance"]> {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("ai_allowance_periods")
    .select("*")
    .eq("user_id", userId)
    .lte("period_start", now)
    .gt("period_end", now)
    .maybeSingle();

  if (error) {
    logStep("Error checking active allowance", { error: error.message, userId });
    throw new Error(`Failed to check active allowance: ${error.message}`);
  }

  return data;
}

/**
 * Create a new allowance period for the user
 * Uses calendar month for manual users, or custom dates for Stripe
 */
// deno-lint-ignore no-explicit-any
async function createAllowancePeriod(
  supabaseAdmin: any,
  userId: string,
  options: {
    periodStart?: Date;
    periodEnd?: Date;
    tokensGranted: number;
    creditsGranted: number;
    tokensPerCredit: number;
    source: string;
  }
): Promise<AllowanceResult["allowance"]> {
  const { periodStart: customStart, periodEnd: customEnd, tokensGranted, creditsGranted, tokensPerCredit, source } = options;
  
  // Use custom dates or default to calendar month
  const { periodStart: defaultStart, periodEnd: defaultEnd } = getCurrentMonthPeriod();
  const periodStart = customStart ?? defaultStart;
  const periodEnd = customEnd ?? defaultEnd;

  // Calculate milli-credits (1 credit = 1000 milli-credits)
  const milliCreditsGranted = creditsGranted * 1000;
  
  // Calculate token to milli-credit factor
  // If tokensPerCredit = 200 and 1 credit = 1000 milli-credits
  // Then 1 token = 1000/200 = 5 milli-credits
  const tokenToMilliCreditFactor = tokensPerCredit > 0 ? 1000 / tokensPerCredit : 0;

  logStep("Creating allowance period", {
    userId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    tokensGranted,
    creditsGranted,
    milliCreditsGranted,
    tokenToMilliCreditFactor,
    source,
  });

  const { data, error } = await supabaseAdmin
    .from("ai_allowance_periods")
    .insert({
      user_id: userId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      tokens_granted: tokensGranted,
      tokens_used: 0,
      credits_granted: creditsGranted,
      credits_used: 0,
      milli_credits_granted: milliCreditsGranted,
      milli_credits_used: 0,
      token_to_milli_credit_factor: tokenToMilliCreditFactor,
      source,
      metadata: {
        created_by: "ensure-token-allowance",
        created_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    logStep("Error creating allowance", { error: error.message, userId });
    throw new Error(`Failed to create allowance period: ${error.message}`);
  }

  return data;
}

/**
 * Main function: Ensure user has an active token allowance
 * - If active period exists: return it
 * - If no active period: create one based on user's plan
 */
// deno-lint-ignore no-explicit-any
async function ensureTokenAllowance(
  supabaseAdmin: any,
  userId: string,
  options?: {
    periodStart?: Date;
    periodEnd?: Date;
    source?: string;
    forceCredits?: number;
  }
): Promise<AllowanceResult> {
  logStep("Ensuring token allowance", { userId, options });

  // Check for existing active period
  const existingAllowance = await getActiveAllowance(supabaseAdmin, userId);
  
  if (existingAllowance) {
    logStep("Found existing active allowance", { 
      allowanceId: existingAllowance.id,
      periodEnd: existingAllowance.period_end,
    });
    return { created: false, allowance: existingAllowance };
  }

  // No active period - create one
  logStep("No active allowance found, creating new one");

  // Get settings and user plan
  const settings = await getTokenSettings(supabaseAdmin);
  const planType = await getUserPlanType(supabaseAdmin, userId);

  logStep("User plan and settings", { planType, settings });

  // Determine credits based on plan (or use forced value)
  let creditsGranted: number;
  if (options?.forceCredits !== undefined) {
    creditsGranted = options.forceCredits;
  } else {
    creditsGranted = planType === "premium" 
      ? settings.creditsPremiumPerMonth 
      : settings.creditsFreePerMonth;
  }

  // Calculate tokens from credits
  const tokensGranted = creditsGranted * settings.tokensPerCredit;
  const source = options?.source ?? (planType === "premium" ? "subscription" : "free_tier");

  const newAllowance = await createAllowancePeriod(supabaseAdmin, userId, {
    periodStart: options?.periodStart,
    periodEnd: options?.periodEnd,
    tokensGranted,
    creditsGranted,
    tokensPerCredit: settings.tokensPerCredit,
    source,
  });

  return { created: true, allowance: newAllowance };
}

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
      force_credits?: number;
      batch_init?: boolean;
    } = {};
    
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - will use auth token
    }

    // If batch_init is true, initialize all users without active periods
    if (body.batch_init === true) {
      logStep("Batch initialization requested");
      
      // Get all users from profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, plan_type");

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      const results: { user_id: string; created: boolean; error?: string }[] = [];

      for (const profile of profiles || []) {
        try {
          const result = await ensureTokenAllowance(supabaseAdmin, profile.id);
          results.push({ user_id: profile.id, created: result.created });
        } catch (err) {
          results.push({ 
            user_id: profile.id, 
            created: false, 
            error: err instanceof Error ? err.message : String(err) 
          });
        }
      }

      const created = results.filter(r => r.created).length;
      const skipped = results.filter(r => !r.created && !r.error).length;
      const errors = results.filter(r => r.error).length;

      logStep("Batch initialization complete", { created, skipped, errors });

      return new Response(JSON.stringify({
        success: true,
        summary: { created, skipped, errors },
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Single user mode
    let userId: string;

    if (body.user_id) {
      // Admin specifying a user ID
      userId = body.user_id;
      logStep("Using provided user_id", { userId });
    } else {
      // Get user from auth token
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header provided");
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !userData.user) {
        throw new Error(`Authentication error: ${userError?.message ?? "User not found"}`);
      }

      userId = userData.user.id;
      logStep("Authenticated user", { userId });
    }

    // Build options
    const options: {
      periodStart?: Date;
      periodEnd?: Date;
      source?: string;
      forceCredits?: number;
    } = {};

    if (body.period_start) {
      options.periodStart = new Date(body.period_start);
    }
    if (body.period_end) {
      options.periodEnd = new Date(body.period_end);
    }
    if (body.source) {
      options.source = body.source;
    }
    if (body.force_credits !== undefined) {
      options.forceCredits = body.force_credits;
    }

    const result = await ensureTokenAllowance(supabaseAdmin, userId, options);

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
