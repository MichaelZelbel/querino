import { n as toast } from "../_libs/sonner.mjs";
import { n as format } from "../_libs/date-fns.mjs";
import { t as useAICredits } from "./useAICredits-C3u0-Q2o.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useAICreditsGate-CWqt47PK.js
/**
* Hook to gate AI calls based on remaining credits.
* Returns a function that checks credits before allowing AI operations.
*/
function useAICreditsGate() {
	const { credits, isLoading, refetch } = useAICredits();
	const hasCredits = credits ? credits.remainingCredits > 0 : false;
	const totalCredits = credits ? (credits.planBaseCredits ?? 0) + credits.rolloverTokens / (credits.tokensPerCredit || 200) : 0;
	const isLowCredits = !!credits && credits.remainingCredits > 0 && totalCredits > 0 && credits.remainingCredits / totalCredits < .1;
	/**
	* Check if user can make an AI call. Shows a contextual toast when out of
	* credits (with reset date) instead of a generic error.
	* @returns true if user has credits, false otherwise
	*/
	const checkCredits = () => {
		if (isLoading) return true;
		if (!credits || credits.remainingCredits <= 0) {
			const resetDate = credits?.periodEnd ? format(new Date(credits.periodEnd), "dd MMM 'at' h:mm a") : null;
			toast.error("Out of AI credits", {
				description: resetDate ? `Your credits reset on ${resetDate}. Need more sooner? Email support@querino.ai.` : "Your credits will reset at the start of your next billing period. Need more sooner? Email support@querino.ai.",
				duration: 1e4
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
		refetchCredits: refetch
	};
}
//#endregion
export { useAICreditsGate as t };
