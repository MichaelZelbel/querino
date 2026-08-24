import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/usePrompts-2WpWnSVp.js
function usePrompts() {
	return useQuery({
		queryKey: ["prompts", "public"],
		queryFn: async () => {
			const { data, error } = await supabase.from("prompts").select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `).eq("is_public", true).order("rating_avg", { ascending: false }).order("rating_count", { ascending: false }).order("created_at", { ascending: false });
			if (error) throw new Error(error.message);
			return data.map((item) => ({
				...item,
				author: item.profiles || null,
				profiles: void 0
			}));
		}
	});
}
//#endregion
export { usePrompts as t };
