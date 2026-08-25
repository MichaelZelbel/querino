import { a as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as useAuthContext } from "./router-compat-xSZ_AoUj.mjs";
import { a as useQueryClient, r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useUserRole-B1YhonQE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* Hook to fetch and manage the current user's role from the user_roles table.
* Backed by TanStack Query so multiple components share a single cached request
* per user instead of each issuing its own Supabase query.
*
* Public API is intentionally identical to the previous useState/useEffect
* implementation — callers do not need to be updated.
*/
function useUserRole() {
	const { user } = useAuthContext();
	const queryClient = useQueryClient();
	const userId = user?.id ?? null;
	const query = useQuery({
		queryKey: ["user-role", userId],
		enabled: !!userId,
		staleTime: 3e5,
		gcTime: 18e5,
		retry: 1,
		queryFn: async () => {
			const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
			if (error) {
				if (error.code === "PGRST116") return "free";
				throw error;
			}
			return data.role;
		}
	});
	const role = userId ? query.data ?? null : null;
	const refetch = (0, import_react.useCallback)(async () => {
		if (!userId) return;
		await queryClient.invalidateQueries({ queryKey: ["user-role", userId] });
	}, [queryClient, userId]);
	return {
		role,
		isLoading: !!userId && query.isLoading,
		error: query.error ? query.error.message : null,
		isAdmin: role === "admin",
		isPremium: role === "premium" || role === "premium_gift" || role === "admin",
		isFree: role === "free",
		refetch
	};
}
//#endregion
export { useUserRole as t };
