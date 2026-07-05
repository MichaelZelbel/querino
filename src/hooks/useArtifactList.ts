import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mergeWithSemantic } from "./useSemanticMerge";

export type ArtifactSortOption = "newest" | "rating";

export interface ArtifactListOptions {
  searchQuery?: string;
  published?: boolean;
  authorId?: string;
  teamId?: string;
  /** Server-side category filter (undefined/"all" = no filter). */
  category?: string;
  /** Browse sort. Ignored while searching (relevance order wins). */
  sortBy?: ArtifactSortOption;
  /** Cap the number of rows fetched. Public discovery surfaces pass this so
   *  a growing catalog can't turn every page view into a full-table download. */
  limit?: number;
}

interface ArtifactListConfig {
  /** Supabase table, e.g. "skills" */
  table: string;
  /** TanStack query-key namespace, usually same as table */
  queryKey: string;
  /** Semantic-search RPC family (see useSemanticMerge) */
  semanticType: "skill" | "workflow" | "prompt_kit";
}

/**
 * Shared list-hook factory for the artifact types that follow the common
 * shape (published flag, author/team scope, FTS + semantic search).
 * useSkills / useWorkflows / usePromptKits are thin wrappers around this,
 * so pagination or query changes happen once, not once per type.
 */
export function createArtifactListHook<T extends { id: string }>(
  config: ArtifactListConfig
) {
  const fetchByIds = async (ids: string[]): Promise<T[]> => {
    if (ids.length === 0) return [];
    const { data, error } = await (supabase.from(config.table) as any)
      .select(`*, profiles:author_id (id, display_name, avatar_url)`)
      .in("id", ids);
    if (error || !data) return [];
    return (data as any[]).map((item) => ({ ...item, author: item.profiles || null }));
  };

  return function useArtifactList(options: ArtifactListOptions = {}) {
    const { searchQuery = "", published, authorId, teamId, category, sortBy = "newest", limit } = options;

    return useQuery<T[]>({
      queryKey: [config.queryKey, searchQuery, published, authorId, teamId, category, sortBy, limit],
      queryFn: async () => {
        let query = (supabase.from(config.table) as any)
          .select(`
            *,
            profiles:author_id (
              id,
              display_name,
              avatar_url
            )
          `);

        if (sortBy === "rating") {
          query = query
            .order("rating_avg", { ascending: false })
            .order("rating_count", { ascending: false })
            .order("created_at", { ascending: false });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        if (published !== undefined) {
          query = query.eq("published", published);
        }

        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        if (teamId) {
          query = query.eq("team_id", teamId);
        } else if (authorId) {
          query = query.eq("author_id", authorId).is("team_id", null);
        }

        if (searchQuery.trim()) {
          query = query.textSearch(
            "title,description,content",
            searchQuery.trim(),
            { type: "websearch", config: "simple" }
          );
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;

        const ftsResults = (data || []).map((item: any) => ({
          ...item,
          author: item.profiles || null,
        })) as T[];

        // Hybrid: append semantic-only matches for public searches
        if (published === true && searchQuery.trim().length >= 3) {
          return await mergeWithSemantic(
            config.semanticType,
            searchQuery.trim(),
            ftsResults,
            fetchByIds
          );
        }

        return ftsResults;
      },
    });
  };
}
