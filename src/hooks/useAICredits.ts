import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AI_CREDITS_QUERY_KEY } from "@/lib/aiCredits";

interface AICreditsData {
  id: string;
  tokensGranted: number;
  tokensUsed: number;
  remainingTokens: number;
  // Calculated credits for display
  creditsGranted: number;
  creditsUsed: number;
  remainingCredits: number;
  // Period info
  periodStart: string;
  periodEnd: string;
  source: string | null;
  // Rollover info from metadata
  rolloverTokens: number;
  baseTokens: number;
  // Plan info
  planBaseCredits: number;
  tokensPerCredit: number;
}

async function fetchAICredits(userId: string): Promise<AICreditsData | null> {
  // First ensure the user has an allowance period
  await supabase.functions.invoke("ensure-token-allowance");

  // Fetch the allowance and the token price in parallel
  const [allowanceResult, settingsResult] = await Promise.all([
    supabase
      .from("v_ai_allowance_current")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("ai_credit_settings")
      .select("key, value_int")
      .eq("key", "tokens_per_credit"),
  ]);

  if (allowanceResult.error) {
    console.error("[AICredits] Fetch error:", allowanceResult.error);
    throw new Error(allowanceResult.error.message);
  }

  const tokensPerCredit = settingsResult.data?.[0]?.value_int || 200;

  const data = allowanceResult.data;
  if (!data) return null;

  // Parse metadata for rollover info
  const metadata = data.metadata as {
    rollover_tokens?: number;
    base_tokens?: number;
  } | null;

  // Tokens are the source of truth
  const tokensGranted = Number(data.tokens_granted) || 0;
  const tokensUsed = Number(data.tokens_used) || 0;
  const remainingTokens = Number(data.remaining_tokens) || 0;

  // The plan's monthly base is the number the server granted this period, not
  // one worked out here. This used to read profiles.plan_type, but
  // ensure_ai_allowance grants by user_roles, so an account given Premium as a
  // gift was shown a base of 500 credits while it had 1,500 (2026-10-07).
  // base_tokens is what the grant wrote before adding the rollover; a period
  // made without it carries its whole grant as the base.
  const baseTokens =
    typeof metadata?.base_tokens === "number"
      ? metadata.base_tokens
      : tokensGranted;

  return {
    id: data.id || "",
    tokensGranted,
    tokensUsed,
    remainingTokens,
    // Calculate credits dynamically from tokens
    creditsGranted: tokensGranted / tokensPerCredit,
    creditsUsed: tokensUsed / tokensPerCredit,
    remainingCredits: remainingTokens / tokensPerCredit,
    periodStart: data.period_start || "",
    periodEnd: data.period_end || "",
    source: data.source,
    rolloverTokens: metadata?.rollover_tokens || 0,
    baseTokens,
    planBaseCredits: baseTokens / tokensPerCredit,
    tokensPerCredit,
  };
}

// The low-credit warning is shown once per signed-in user per page load, not
// once per mounted hook: every AI button mounts a gate, and a per-instance
// flag toasted the same warning once for each of them.
let lowCreditWarningShownFor: string | null = null;

/**
 * The full credit balance, shared through the query cache. It lives under
 * AI_CREDITS_QUERY_KEY, so refreshAICredits() (run after every charging edge
 * function) refetches it together with the header pill. Before this it was
 * per-component state: invalidation never reached it, and each mounted gate
 * ran ensure-token-allowance plus three queries of its own.
 */
export function useAICredits() {
  const { user } = useAuthContext();
  const userId = user?.id;

  const query = useQuery({
    queryKey: [AI_CREDITS_QUERY_KEY, "full", userId],
    enabled: !!userId,
    staleTime: 30_000,
    // enabled: !!userId above is what guarantees this is set.
    queryFn: () => fetchAICredits(userId!),
  });

  // Signing out has to clear the balance, not freeze it: the query for the
  // previous account is simply no longer the one this hook reads.
  const credits = userId ? (query.data ?? null) : null;

  // Check for low credits and show warning toast (once per session)
  useEffect(() => {
    if (!credits || !userId || lowCreditWarningShownFor === userId) return;

    const {
      remainingCredits,
      planBaseCredits,
      rolloverTokens,
      tokensPerCredit,
    } = credits;
    const rolloverCredits = rolloverTokens / tokensPerCredit;
    const totalCredits = (planBaseCredits ?? 1500) + rolloverCredits;

    // Show warning if less than 15% remaining and user has some credits to begin with
    if (
      totalCredits > 0 &&
      remainingCredits > 0 &&
      remainingCredits / totalCredits < 0.15
    ) {
      lowCreditWarningShownFor = userId;
      toast.warning("Low AI Credits", {
        description: `You have ${Math.round(remainingCredits)} credits remaining. They will reset at the start of your next billing period.`,
        duration: 8000,
      });
    }
  }, [credits, userId]);

  const { refetch } = query;

  return {
    credits,
    isLoading: !!userId && query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Unknown error"
      : null,
    refetch: async () => {
      await refetch();
    },
  };
}
