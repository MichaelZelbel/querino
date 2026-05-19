import { useAICredits } from './useAICredits';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Hook to gate AI calls based on remaining credits.
 * Returns a function that checks credits before allowing AI operations.
 */
export function useAICreditsGate() {
  const { credits, isLoading, refetch } = useAICredits();

  const hasCredits = credits ? credits.remainingCredits > 0 : false;

  // Low-credit signal — exposed so callers can show inline upsell UI.
  const totalCredits = credits
    ? (credits.planBaseCredits ?? 0) + credits.rolloverTokens / (credits.tokensPerCredit || 200)
    : 0;
  const isLowCredits =
    !!credits &&
    credits.remainingCredits > 0 &&
    totalCredits > 0 &&
    credits.remainingCredits / totalCredits < 0.1;

  /**
   * Check if user can make an AI call. Shows a contextual toast when out of
   * credits (with reset date) instead of a generic error.
   * @returns true if user has credits, false otherwise
   */
  const checkCredits = (): boolean => {
    if (isLoading) {
      // Still loading, allow the call (will be caught server-side if needed)
      return true;
    }

    if (!credits || credits.remainingCredits <= 0) {
      const resetDate = credits?.periodEnd
        ? format(new Date(credits.periodEnd), "dd MMM 'at' h:mm a")
        : null;
      toast.error("Out of AI credits", {
        description: resetDate
          ? `Your credits reset on ${resetDate}. Need more sooner? Email support@querino.ai.`
          : "Your credits will reset at the start of your next billing period. Need more sooner? Email support@querino.ai.",
        duration: 10000,
      });
      return false;
    }

    return true;
  };

  return {
    hasCredits,
    isLowCredits,
    isLoading,
    checkCredits,
    credits,
    refetchCredits: refetch,
  };
}
