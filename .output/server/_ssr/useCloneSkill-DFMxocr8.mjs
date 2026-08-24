import { t as createCloneHook } from "./useCloneArtifact-C6wTjE_T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useCloneSkill-DFMxocr8.js
var useBase = createCloneHook({
	table: "skills",
	label: "skill",
	buildInsert: (skill) => ({
		description: skill.description,
		content: skill.content,
		tags: skill.tags,
		published: false
	}),
	editPath: (row) => `/skills/${row.slug}/edit`
});
function useCloneSkill() {
	const { clone, cloning } = useBase();
	return {
		cloneSkill: clone,
		cloning
	};
}
//#endregion
export { useCloneSkill as t };
