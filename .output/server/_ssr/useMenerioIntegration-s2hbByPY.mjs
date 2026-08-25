import { a as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useMenerioIntegration-s2hbByPY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useMenerioIntegration(userId) {
	const [hasIntegration, setHasIntegration] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		if (!userId) {
			setHasIntegration(false);
			setLoading(false);
			return;
		}
		supabase.from("menerio_integration").select("id").eq("user_id", userId).eq("is_active", true).maybeSingle().then(({ data }) => {
			setHasIntegration(!!data);
			setLoading(false);
		});
	}, [userId]);
	return {
		hasIntegration,
		loading
	};
}
//#endregion
export { useMenerioIntegration as t };
