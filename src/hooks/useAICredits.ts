import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface AICreditsData {
  id: string;
  creditsGranted: number;
  creditsUsed: number;
  remainingCredits: number;
  periodStart: string;
  periodEnd: string;
  rolloverCredits: number;
  baseCredits: number;
  planBaseCredits: number;
  source: string | null;
}

export function useAICredits() {
  const { user } = useAuthContext();
  const [credits, setCredits] = useState<AICreditsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First ensure the user has an allowance period
      await supabase.functions.invoke("ensure-token-allowance");

      // Fetch user's plan type and credit settings in parallel
      const [allowanceResult, profileResult, settingsResult] = await Promise.all([
        supabase
          .from("v_ai_allowance_current")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("plan_type")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("ai_credit_settings")
          .select("key, value_int")
          .in("key", ["credits_free_per_month", "credits_premium_per_month"]),
      ]);

      if (allowanceResult.error) {
        console.error("[AICredits] Fetch error:", allowanceResult.error);
        setError(allowanceResult.error.message);
        return;
      }

      // Determine plan base credits from settings
      const isPremium = profileResult.data?.plan_type === "premium";
      const settingsMap = Object.fromEntries(
        (settingsResult.data || []).map((s) => [s.key, s.value_int])
      );
      const planBaseCredits = isPremium
        ? settingsMap["credits_premium_per_month"] || 1500
        : settingsMap["credits_free_per_month"] || 0;

      const data = allowanceResult.data;
      if (data) {
        // Parse metadata for rollover info
        const metadata = data.metadata as { 
          rollover_credits?: number; 
          base_credits?: number;
        } | null;

        // Calculate credits from tokens if credits are 0 but tokens exist
        // token_to_milli_credit_factor: 1 token = X milli-credits
        // 1000 milli-credits = 1 credit
        const tokenToMilliCreditFactor = Number(data.token_to_milli_credit_factor) || 5;
        const tokensGranted = Number(data.tokens_granted) || 0;
        const tokensUsed = Number(data.tokens_used) || 0;
        const remainingTokens = Number(data.remaining_tokens) || 0;

        // Use credits if available, otherwise calculate from tokens
        let creditsGranted = Number(data.credits_granted) || 0;
        let creditsUsed = Number(data.credits_used) || 0;
        let remainingCredits = Number(data.remaining_credits) || 0;

        // If credits are 0 but tokens exist, calculate credits from tokens
        if (creditsGranted === 0 && tokensGranted > 0) {
          // Convert tokens to credits: tokens * factor / 1000
          creditsGranted = (tokensGranted * tokenToMilliCreditFactor) / 1000;
          creditsUsed = (tokensUsed * tokenToMilliCreditFactor) / 1000;
          remainingCredits = (remainingTokens * tokenToMilliCreditFactor) / 1000;
        }

        setCredits({
          id: data.id || "",
          creditsGranted,
          creditsUsed,
          remainingCredits,
          periodStart: data.period_start || "",
          periodEnd: data.period_end || "",
          rolloverCredits: metadata?.rollover_credits || 0,
          baseCredits: metadata?.base_credits || planBaseCredits,
          planBaseCredits,
          source: data.source,
        });
      } else {
        setCredits(null);
      }
    } catch (err) {
      console.error("[AICredits] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user, fetchCredits]);

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
  };
}
