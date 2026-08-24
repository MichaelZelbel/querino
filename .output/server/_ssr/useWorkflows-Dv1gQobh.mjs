import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as mergeWithSemantic } from "./useSemanticMerge-Cq21jyT4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useWorkflows-Dv1gQobh.js
/**
* Shared list-hook factory for the artifact types that follow the common
* shape (published flag, author/team scope, FTS + semantic search).
* useSkills / useWorkflows / usePromptKits are thin wrappers around this,
* so pagination or query changes happen once, not once per type.
*/
function createArtifactListHook(config) {
	const fetchByIds = async (ids) => {
		if (ids.length === 0) return [];
		const { data, error } = await supabase.from(config.table).select(`*, profiles:author_id (id, display_name, avatar_url)`).in("id", ids);
		if (error || !data) return [];
		return data.map((item) => ({
			...item,
			author: item.profiles || null
		}));
	};
	return function useArtifactList(options = {}) {
		const { searchQuery = "", published, authorId, teamId, category, sortBy = "newest", limit } = options;
		return useQuery({
			queryKey: [
				config.queryKey,
				searchQuery,
				published,
				authorId,
				teamId,
				category,
				sortBy,
				limit
			],
			queryFn: async () => {
				let query = supabase.from(config.table).select(`
            *,
            profiles:author_id (
              id,
              display_name,
              avatar_url
            )
          `);
				if (sortBy === "rating") query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false }).order("created_at", { ascending: false });
				else query = query.order("created_at", { ascending: false });
				if (published !== void 0) query = query.eq("published", published);
				if (category && category !== "all") query = query.eq("category", category);
				if (teamId) query = query.eq("team_id", teamId);
				else if (authorId) query = query.eq("author_id", authorId).is("team_id", null);
				if (searchQuery.trim()) query = query.textSearch("title,description,content", searchQuery.trim(), {
					type: "websearch",
					config: "simple"
				});
				if (limit) query = query.limit(limit);
				const { data, error } = await query;
				if (error) throw error;
				const ftsResults = (data || []).map((item) => ({
					...item,
					author: item.profiles || null
				}));
				if (published === true && searchQuery.trim().length >= 3) return await mergeWithSemantic(config.semanticType, searchQuery.trim(), ftsResults, fetchByIds);
				return ftsResults;
			}
		});
	};
}
var useSkills = createArtifactListHook({
	table: "skills",
	queryKey: "skills",
	semanticType: "skill"
});
var useWorkflows = createArtifactListHook({
	table: "workflows",
	queryKey: "workflows",
	semanticType: "workflow"
});
//#endregion
export { useSkills as n, useWorkflows as r, createArtifactListHook as t };
