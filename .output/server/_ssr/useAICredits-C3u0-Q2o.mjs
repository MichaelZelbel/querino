import { a as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext } from "./router-compat-xSZ_AoUj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useAICredits-C3u0-Q2o.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useAICredits() {
	const { user } = useAuthContext();
	const [credits, setCredits] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const lowCreditWarningShownRef = (0, import_react.useRef)(false);
	const fetchCredits = (0, import_react.useCallback)(async () => {
		if (!user) {
			setCredits(null);
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			await supabase.functions.invoke("ensure-token-allowance");
			const [allowanceResult, profileResult, settingsResult] = await Promise.all([
				supabase.from("v_ai_allowance_current").select("*").eq("user_id", user.id).maybeSingle(),
				supabase.rpc("get_my_plan"),
				supabase.from("ai_credit_settings").select("key, value_int").in("key", [
					"credits_free_per_month",
					"credits_premium_per_month",
					"tokens_per_credit"
				])
			]);
			if (allowanceResult.error) {
				console.error("[AICredits] Fetch error:", allowanceResult.error);
				setError(allowanceResult.error.message);
				return;
			}
			const settingsMap = Object.fromEntries((settingsResult.data || []).map((s) => [s.key, s.value_int]));
			const tokensPerCredit = settingsMap["tokens_per_credit"] || 200;
			const planBaseCredits = profileResult.data?.[0]?.plan_type === "premium" ? settingsMap["credits_premium_per_month"] || 1500 : settingsMap["credits_free_per_month"] || 0;
			const data = allowanceResult.data;
			if (data) {
				const metadata = data.metadata;
				const tokensGranted = Number(data.tokens_granted) || 0;
				const tokensUsed = Number(data.tokens_used) || 0;
				const remainingTokens = Number(data.remaining_tokens) || 0;
				const creditsGranted = tokensGranted / tokensPerCredit;
				const creditsUsed = tokensUsed / tokensPerCredit;
				const remainingCredits = remainingTokens / tokensPerCredit;
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
					tokensPerCredit
				});
			} else setCredits(null);
		} catch (err) {
			console.error("[AICredits] Unexpected error:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [user]);
	(0, import_react.useEffect)(() => {
		if (!credits || lowCreditWarningShownRef.current) return;
		const { remainingCredits, planBaseCredits, rolloverTokens, tokensPerCredit } = credits;
		const rolloverCredits = rolloverTokens / tokensPerCredit;
		const totalCredits = (planBaseCredits ?? 1500) + rolloverCredits;
		if (totalCredits > 0 && remainingCredits > 0 && remainingCredits / totalCredits < .15) {
			lowCreditWarningShownRef.current = true;
			toast.warning("Low AI Credits", {
				description: `You have ${Math.round(remainingCredits)} credits remaining. They will reset at the start of your next billing period.`,
				duration: 8e3
			});
		}
	}, [credits]);
	(0, import_react.useEffect)(() => {
		if (user) fetchCredits();
	}, [user, fetchCredits]);
	return {
		credits,
		isLoading,
		error,
		refetch: fetchCredits
	};
}
//#endregion
export { useAICredits as t };
