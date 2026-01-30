import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

export function useAICredits() {
  const { user } = useAuthContext();
  const [credits, setCredits] = useState<AICreditsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lowCreditWarningShownRef = useRef(false);

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

      // Fetch allowance data and settings in parallel
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
          .in("key", ["credits_free_per_month", "credits_premium_per_month", "tokens_per_credit"]),
      ]);

      if (allowanceResult.error) {
        console.error("[AICredits] Fetch error:", allowanceResult.error);
        setError(allowanceResult.error.message);
        return;
      }

      // Build settings map
      const settingsMap = Object.fromEntries(
        (settingsResult.data || []).map((s) => [s.key, s.value_int])
      );
      const tokensPerCredit = settingsMap["tokens_per_credit"] || 200;
      
      // Determine plan base credits
      const isPremium = profileResult.data?.plan_type === "premium";
      const planBaseCredits = isPremium
        ? settingsMap["credits_premium_per_month"] || 1500
        : settingsMap["credits_free_per_month"] || 0;

      const data = allowanceResult.data;
      if (data) {
        // Parse metadata for rollover info
        const metadata = data.metadata as { 
          rollover_tokens?: number; 
          base_tokens?: number;
        } | null;

        // Tokens are the source of truth
        const tokensGranted = Number(data.tokens_granted) || 0;
        const tokensUsed = Number(data.tokens_used) || 0;
        const remainingTokens = Number(data.remaining_tokens) || 0;

        // Calculate credits dynamically from tokens
        const creditsGranted = tokensGranted / tokensPerCredit;
        const creditsUsed = tokensUsed / tokensPerCredit;
        const remainingCredits = remainingTokens / tokensPerCredit;

        // Rollover tokens from metadata
        const rolloverTokens = metadata?.rollover_tokens || 0;
        const baseTokens = metadata?.base_tokens || tokensGranted;

        setCredits({
          id: data.id || "",
          tokensGranted,
          tokensUsed,
          remainingTokens,
          creditsGranted,
          creditsUsed,
          remainingCredits,
          periodStart: data.period_start || "",
          periodEnd: data.period_end || "",
          source: data.source,
          rolloverTokens,
          baseTokens,
          planBaseCredits,
          tokensPerCredit,
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

  // Check for low credits and show warning toast (once per session)
  useEffect(() => {
    if (!credits || lowCreditWarningShownRef.current) return;
    
    const { remainingCredits, planBaseCredits, rolloverTokens, tokensPerCredit } = credits;
    const rolloverCredits = rolloverTokens / tokensPerCredit;
    const totalCredits = (planBaseCredits ?? 1500) + rolloverCredits;
    
    // Show warning if less than 15% remaining and user has some credits to begin with
    if (totalCredits > 0 && remainingCredits > 0 && (remainingCredits / totalCredits) < 0.15) {
      lowCreditWarningShownRef.current = true;
      toast.warning("Low AI Credits", {
        description: `You have ${Math.round(remainingCredits)} credits remaining. They will reset at the start of your next billing period.`,
        duration: 8000,
      });
    }
  }, [credits]);

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
