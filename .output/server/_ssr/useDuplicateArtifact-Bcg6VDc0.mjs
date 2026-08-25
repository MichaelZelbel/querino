import { a as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useDuplicateArtifact-Bcg6VDc0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* Generates a Windows Explorer-style duplicate title.
* Given "My Title" and existing titles, returns "My Title (1)", "My Title (2)", etc.
*/
function generateDuplicateTitle(originalTitle, existingTitles) {
	const baseMatch = originalTitle.match(/^(.*?)\s*\((\d+)\)$/);
	const baseTitle = baseMatch ? baseMatch[1] : originalTitle;
	const usedNumbers = /* @__PURE__ */ new Set();
	const pattern = new RegExp(`^${escapeRegex(baseTitle)}\\s*\\((\\d+)\\)$`);
	for (const title of existingTitles) {
		const match = title.match(pattern);
		if (match) usedNumbers.add(parseInt(match[1], 10));
	}
	let num = 1;
	while (usedNumbers.has(num)) num++;
	return `${baseTitle} (${num})`;
}
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function useDuplicateArtifact() {
	const [duplicating, setDuplicating] = (0, import_react.useState)(false);
	const navigate = useNavigate$1();
	const duplicateArtifact = async (type, artifact, userId) => {
		setDuplicating(true);
		try {
			const table = type === "prompt" ? "prompts" : type === "skill" ? "skills" : "workflows";
			const { data: existing } = await supabase.from(table).select("title").eq("author_id", userId);
			const existingTitles = (existing || []).map((r) => r.title);
			const newTitle = generateDuplicateTitle(artifact.title, existingTitles);
			let insertData;
			let editPath;
			switch (type) {
				case "prompt":
					insertData = {
						title: newTitle,
						description: artifact.description,
						content: artifact.content,
						category: artifact.category,
						tags: artifact.tags || [],
						author_id: userId,
						is_public: false,
						rating_avg: 0,
						rating_count: 0,
						copies_count: 0,
						language: artifact.language || "en",
						summary: artifact.summary || null,
						example_output: artifact.example_output || null,
						team_id: artifact.team_id || null
					};
					break;
				case "skill":
					insertData = {
						title: newTitle,
						description: artifact.description || null,
						content: artifact.content,
						category: artifact.category || null,
						tags: artifact.tags || [],
						author_id: userId,
						published: false,
						rating_avg: 0,
						rating_count: 0,
						language: artifact.language || "en",
						team_id: artifact.team_id || null
					};
					break;
				case "workflow": insertData = {
					title: newTitle,
					description: artifact.description || null,
					content: artifact.content || null,
					json: artifact.json || {},
					category: artifact.category || null,
					tags: artifact.tags || [],
					author_id: userId,
					published: false,
					rating_avg: 0,
					rating_count: 0,
					language: artifact.language || "en",
					team_id: artifact.team_id || null,
					filename: artifact.filename || null
				};
			}
			const { data, error } = await supabase.from(table).insert(insertData).select("id, slug").single();
			if (error) throw error;
			const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
			toast.success(`${typeLabel} duplicated as "${newTitle}"`);
			switch (type) {
				case "prompt":
					editPath = `/library/${data.slug}/edit`;
					break;
				case "skill":
					editPath = `/skills/${data.slug}/edit`;
					break;
				case "workflow": editPath = `/workflows/${data.slug}/edit`;
			}
			navigate(editPath);
			return data;
		} catch (err) {
			console.error(`Error duplicating ${type}:`, err);
			toast.error(`Failed to duplicate ${type}`);
			return null;
		} finally {
			setDuplicating(false);
		}
	};
	return {
		duplicateArtifact,
		duplicating
	};
}
//#endregion
export { useDuplicateArtifact as t };
