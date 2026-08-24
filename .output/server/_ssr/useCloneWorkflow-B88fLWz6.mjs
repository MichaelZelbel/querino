import { t as createCloneHook } from "./useCloneArtifact-C6wTjE_T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useCloneWorkflow-B88fLWz6.js
var useBase = createCloneHook({
	table: "workflows",
	label: "workflow",
	buildInsert: (workflow) => ({
		description: workflow.description,
		json: workflow.json,
		tags: workflow.tags,
		published: false
	}),
	editPath: (row) => `/workflows/${row.id}/edit`
});
function useCloneWorkflow() {
	const { clone, cloning } = useBase();
	return {
		cloneWorkflow: clone,
		cloning
	};
}
//#endregion
export { useCloneWorkflow as t };
