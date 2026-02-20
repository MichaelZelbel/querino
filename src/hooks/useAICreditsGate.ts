import { useAICredits } from './useAICredits';
import { toast } from 'sonner';

/**
 * Hook to gate AI calls based on remaining credits.
 * Returns a function that checks credits before allowing AI operations.
 */
export function useAICreditsGate() {
  const { credits, isLoading, refetch } = useAICredits();

  const hasCredits = credits ? credits.remainingCredits > 0 : false;

  /**
   * Check if user can make an AI call. Shows toast if no credits.
   * @returns true if user has credits, false otherwise
   */
  const checkCredits = (): boolean => {
    if (isLoading) {
      // Still loading, allow the call (will be caught server-side if needed)
      return true;
    }

    if (!credits || credits.remainingCredits <= 0) {
      toast.error("You've used all your AI Credits. Please wait until they reset or contact support@querino.ai.");
      return false;
    }

    return true;
  };

  return {
    hasCredits,
    isLoading,
    checkCredits,
    credits,
    refetchCredits: refetch,
  };
}
