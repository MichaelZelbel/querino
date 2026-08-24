import { t as createCloneHook } from "./useCloneArtifact-C6wTjE_T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useClonePrompt-DyUgLCDb.js
var useBase = createCloneHook({
	table: "prompts",
	label: "prompt",
	buildInsert: (source) => ({
		description: source.description,
		content: source.content,
		category: source.category,
		tags: source.tags || [],
		is_public: false,
		rating_avg: 0,
		rating_count: 0,
		copies_count: 0
	}),
	editPath: (row) => `/library/${row.slug}/edit`
});
function useClonePrompt() {
	const { clone, cloning } = useBase();
	return {
		clonePrompt: clone,
		cloning
	};
}
//#endregion
export { useClonePrompt as t };
