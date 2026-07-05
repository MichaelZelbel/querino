import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface AICreditsSummary {
  remainingCredits: number;
  periodEnd: string | null;
}

/**
 * Lightweight, cached credits read for always-visible UI (header pill).
 * Unlike useAICredits it does NOT invoke ensure-token-allowance and is
 * deduplicated across mounts via TanStack Query.
 */
export function useAICreditsSummary() {
  const { user } = useAuthContext();

  return useQuery<AICreditsSummary | null>({
    queryKey: ["ai-credits-summary", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [allowanceResult, settingsResult] = await Promise.all([
        supabase
          .from("v_ai_allowance_current")
          .select("remaining_tokens, period_end")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("ai_credit_settings")
          .select("value_int")
          .eq("key", "tokens_per_credit")
          .maybeSingle(),
      ]);

      if (allowanceResult.error || !allowanceResult.data) return null;

      const tokensPerCredit = settingsResult.data?.value_int || 200;
      return {
        remainingCredits:
          (Number(allowanceResult.data.remaining_tokens) || 0) / tokensPerCredit,
        periodEnd: allowanceResult.data.period_end || null,
      };
    },
  });
}
