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

      // Then fetch the current allowance from the view
      const { data, error: fetchError } = await supabase
        .from("v_ai_allowance_current")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("[AICredits] Fetch error:", fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        // Parse metadata for rollover info
        const metadata = data.metadata as { 
          rollover_credits?: number; 
          base_credits?: number;
        } | null;

        setCredits({
          id: data.id || "",
          creditsGranted: Number(data.credits_granted) || 0,
          creditsUsed: Number(data.credits_used) || 0,
          remainingCredits: Number(data.remaining_credits) || 0,
          periodStart: data.period_start || "",
          periodEnd: data.period_end || "",
          rolloverCredits: metadata?.rollover_credits || 0,
          baseCredits: metadata?.base_credits || Number(data.credits_granted) || 0,
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
