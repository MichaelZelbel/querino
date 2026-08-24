import { n as supabase } from "./client-Bi_X_zk2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useSemanticMerge-Cq21jyT4.js
var MIN_QUERY_LEN = 3;
var DEFAULT_THRESHOLD = .25;
var DEFAULT_COUNT = 30;
var RPC_BY_TYPE = {
	prompt: "search_prompts_semantic",
	skill: "search_skills_semantic",
	workflow: "search_workflows_semantic",
	prompt_kit: "search_prompt_kits_semantic"
};
var embeddingCache = /* @__PURE__ */ new Map();
async function getQueryEmbedding(query) {
	const trimmed = query.trim();
	if (!trimmed) return null;
	const cached = embeddingCache.get(trimmed);
	if (cached) return cached;
	try {
		const { data, error } = await supabase.functions.invoke("generate-embedding", { body: { text: trimmed } });
		if (error) {
			console.warn("[semantic-merge] embedding error:", error);
			return null;
		}
		const emb = data?.embedding;
		if (!Array.isArray(emb) || emb.length === 0) return null;
		embeddingCache.set(trimmed, emb);
		return emb;
	} catch (e) {
		console.warn("[semantic-merge] embedding threw:", e);
		return null;
	}
}
/**
* Fetch semantic matches for `query` against the given artifact type.
* Returns an empty array if the query is too short, embedding fails,
* or the RPC errors. Never throws.
*/
async function fetchSemanticMatches(itemType, query, opts = {}) {
	const trimmed = query.trim();
	if (trimmed.length < MIN_QUERY_LEN) return [];
	const embedding = await getQueryEmbedding(trimmed);
	if (!embedding) return [];
	const embeddingStr = `[${embedding.join(",")}]`;
	const rpcName = RPC_BY_TYPE[itemType];
	try {
		const { data, error } = await supabase.rpc(rpcName, {
			query_embedding: embeddingStr,
			match_threshold: opts.threshold ?? DEFAULT_THRESHOLD,
			match_count: opts.count ?? DEFAULT_COUNT
		});
		if (error) {
			console.warn(`[semantic-merge] ${rpcName} error:`, error);
			return [];
		}
		return (data ?? []).map((r) => ({
			id: r.id,
			similarity: Number(r.similarity ?? 0),
			row: r
		}));
	} catch (e) {
		console.warn(`[semantic-merge] ${rpcName} threw:`, e);
		return [];
	}
}
/**
* Merge an existing artifact list (e.g. from FTS) with semantic matches.
* - Items already in `existing` keep their position.
* - Semantic-only matches are appended, sorted by similarity desc.
* - Caller supplies a `fetchById` to hydrate semantic-only ids with full
*   author/profile data (so cards render identically).
*/
async function mergeWithSemantic(itemType, query, existing, fetchByIds, opts = {}) {
	const semantic = await fetchSemanticMatches(itemType, query, opts);
	if (semantic.length === 0) return existing;
	const existingIds = new Set(existing.map((e) => e.id));
	const newOnes = semantic.filter((s) => !existingIds.has(s.id));
	if (newOnes.length === 0) return existing;
	const hydrated = await fetchByIds(newOnes.map((n) => n.id));
	const orderById = new Map(newOnes.map((n, idx) => [n.id, idx]));
	hydrated.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
	return [...existing, ...hydrated];
}
//#endregion
export { mergeWithSemantic as t };
