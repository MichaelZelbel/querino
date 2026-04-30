// Used by usePrompts/useSkills/useWorkflows hooks so that
// keyword-mismatched but semantically-related artifacts still surface.
//
// - Embedding generation goes through the `generate-embedding` edge function
//   (OpenAI text-embedding-3-small, 1536 dim).
// - Semantic RPCs only return public/published items (security definer).
// - Merge order: existing list first (preserves ordering / FTS exact matches),
//   semantic-only results appended at the end, sorted by similarity desc.

import { supabase } from "@/integrations/supabase/client";

const MIN_QUERY_LEN = 3;
const DEFAULT_THRESHOLD = 0.25;
const DEFAULT_COUNT = 30;

type ItemType = "prompt" | "skill" | "workflow" | "prompt_kit";

const RPC_BY_TYPE: Record<ItemType, "search_prompts_semantic" | "search_skills_semantic" | "search_workflows_semantic" | "search_prompt_kits_semantic"> = {
  prompt: "search_prompts_semantic",
  skill: "search_skills_semantic",
  workflow: "search_workflows_semantic",
  prompt_kit: "search_prompt_kits_semantic",
};

// In-memory cache for query embeddings (per page lifetime).
// Avoids repeated OpenAI calls when the user toggles tabs / filters.
const embeddingCache = new Map<string, number[]>();

async function getQueryEmbedding(query: string): Promise<number[] | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const cached = embeddingCache.get(trimmed);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke("generate-embedding", {
      body: { text: trimmed },
    });
    if (error) {
      console.warn("[semantic-merge] embedding error:", error);
      return null;
    }
    const emb = (data as any)?.embedding as number[] | undefined;
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
export async function fetchSemanticMatches(
  itemType: ItemType,
  query: string,
  opts: { threshold?: number; count?: number } = {}
): Promise<Array<{ id: string; similarity: number; row: any }>> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LEN) return [];

  const embedding = await getQueryEmbedding(trimmed);
  if (!embedding) return [];

  const embeddingStr = `[${embedding.join(",")}]`;
  const rpcName = RPC_BY_TYPE[itemType];

  try {
    const { data, error } = await supabase.rpc(rpcName as any, {
      query_embedding: embeddingStr,
      match_threshold: opts.threshold ?? DEFAULT_THRESHOLD,
      match_count: opts.count ?? DEFAULT_COUNT,
    });
    if (error) {
      console.warn(`[semantic-merge] ${rpcName} error:`, error);
      return [];
    }
    return (data ?? []).map((r: any) => ({
      id: r.id,
      similarity: Number(r.similarity ?? 0),
      row: r,
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
export async function mergeWithSemantic<T extends { id: string }>(
  itemType: ItemType,
  query: string,
  existing: T[],
  fetchByIds: (ids: string[]) => Promise<T[]>,
  opts: { threshold?: number; count?: number } = {}
): Promise<T[]> {
  const semantic = await fetchSemanticMatches(itemType, query, opts);
  if (semantic.length === 0) return existing;

  const existingIds = new Set(existing.map((e) => e.id));
  const newOnes = semantic.filter((s) => !existingIds.has(s.id));
  if (newOnes.length === 0) return existing;

  const hydrated = await fetchByIds(newOnes.map((n) => n.id));
  // Preserve similarity ordering from semantic search
  const orderById = new Map(newOnes.map((n, idx) => [n.id, idx]));
  hydrated.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));

  return [...existing, ...hydrated];
}
