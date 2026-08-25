import { a as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as useAuthContext } from "./router-compat-xSZ_AoUj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/usePinnedPrompts-DDaPyuEo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function usePinnedPrompts(options = {}) {
	const { user } = useAuthContext();
	const { teamId, personalOnly } = options;
	const [pinnedPromptIds, setPinnedPromptIds] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [pinnedPrompts, setPinnedPrompts] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const fetchPinnedPromptIds = (0, import_react.useCallback)(async () => {
		if (!user) {
			setPinnedPromptIds(/* @__PURE__ */ new Set());
			return;
		}
		try {
			const { data, error } = await supabase.from("prompt_pins").select("prompt_id").eq("user_id", user.id);
			if (error) {
				console.error("Error fetching pinned prompts:", error);
				return;
			}
			setPinnedPromptIds(new Set(data?.map((row) => row.prompt_id) || []));
		} catch (err) {
			console.error("Error fetching pinned prompts:", err);
		}
	}, [user]);
	const fetchPinnedPrompts = (0, import_react.useCallback)(async () => {
		if (!user) {
			setPinnedPrompts([]);
			return;
		}
		setLoading(true);
		try {
			const { data: pins, error: pinsError } = await supabase.from("prompt_pins").select("prompt_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
			if (pinsError) {
				console.error("Error fetching pins:", pinsError);
				setLoading(false);
				return;
			}
			if (!pins || pins.length === 0) {
				setPinnedPrompts([]);
				setLoading(false);
				return;
			}
			const promptIds = pins.map((p) => p.prompt_id);
			let query = supabase.from("prompts").select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `).in("id", promptIds);
			if (teamId) query = query.eq("team_id", teamId);
			else if (personalOnly) query = query.is("team_id", null);
			const { data: prompts, error: promptsError } = await query;
			if (promptsError) {
				console.error("Error fetching prompts:", promptsError);
				setLoading(false);
				return;
			}
			const promptMap = new Map((prompts || []).map((p) => [p.id, {
				...p,
				author: p.profiles || null
			}]));
			const orderedPrompts = promptIds.map((id) => promptMap.get(id)).filter(Boolean);
			setPinnedPrompts(orderedPrompts);
			setPinnedPromptIds(new Set(pins.map((p) => p.prompt_id)));
		} catch (err) {
			console.error("Error fetching pinned prompts:", err);
		} finally {
			setLoading(false);
		}
	}, [
		user,
		teamId,
		personalOnly
	]);
	(0, import_react.useEffect)(() => {
		fetchPinnedPromptIds();
	}, [fetchPinnedPromptIds]);
	const isPromptPinned = (0, import_react.useCallback)((promptId) => pinnedPromptIds.has(promptId), [pinnedPromptIds]);
	const pinPrompt = (0, import_react.useCallback)(async (promptId) => {
		if (!user) return { error: /* @__PURE__ */ new Error("Not authenticated") };
		try {
			const { error } = await supabase.from("prompt_pins").insert({
				user_id: user.id,
				prompt_id: promptId
			});
			if (error) {
				if (error.code === "23505") return { error: null };
				return { error };
			}
			setPinnedPromptIds((prev) => /* @__PURE__ */ new Set([...prev, promptId]));
			console.log("Prompt pinned", { promptId });
			return { error: null };
		} catch (err) {
			return { error: err };
		}
	}, [user]);
	const unpinPrompt = (0, import_react.useCallback)(async (promptId) => {
		if (!user) return { error: /* @__PURE__ */ new Error("Not authenticated") };
		try {
			const { error } = await supabase.from("prompt_pins").delete().eq("user_id", user.id).eq("prompt_id", promptId);
			if (error) return { error };
			setPinnedPromptIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(promptId);
				return newSet;
			});
			console.log("Prompt unpinned", { promptId });
			return { error: null };
		} catch (err) {
			return { error: err };
		}
	}, [user]);
	return {
		pinnedPromptIds,
		pinnedPrompts,
		loading,
		isPromptPinned,
		pinPrompt,
		unpinPrompt,
		togglePin: (0, import_react.useCallback)(async (promptId) => {
			if (isPromptPinned(promptId)) return unpinPrompt(promptId);
			else return pinPrompt(promptId);
		}, [
			isPromptPinned,
			pinPrompt,
			unpinPrompt
		]),
		refetch: fetchPinnedPrompts,
		refetchIds: fetchPinnedPromptIds
	};
}
//#endregion
export { usePinnedPrompts as t };
