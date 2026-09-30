import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mergeWithSemantic } from "./useSemanticMerge";
import { hasArtifactListScope } from "@/lib/artifactListScope";
import { withPartialMatch } from "@/lib/searchFallback";
import {
  artifactListSelect,
  type ArtifactListTable,
} from "@/lib/artifactListColumns";

export type ArtifactSortOption = "newest" | "rating";

export interface ArtifactListOptions {
  searchQuery?: string;
  published?: boolean;
  authorId?: string;
  teamId?: string;
  /** Server-side category filter (undefined/"all" = no filter). */
  category?: string;
  /** Server-side tag filter: only rows whose tags array contains this tag. */
  tag?: string;
  /** Browse sort. Ignored while searching (relevance order wins). */
  sortBy?: ArtifactSortOption;
  /** Cap the number of rows fetched. Public discovery surfaces pass this so
   *  a growing catalog can't turn every page view into a full-table download. */
  limit?: number;
}

interface ArtifactListConfig {
  /** Supabase table, e.g. "skills" */
  table: ArtifactListTable;
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
  config: ArtifactListConfig,
) {
  const fetchByIds = async (ids: string[]): Promise<T[]> => {
    if (ids.length === 0) return [];
    const { data, error } = await (supabase.from(config.table as any) as any)
      .select(artifactListSelect(config.table))
      .in("id", ids);
    if (error || !data) return [];
    return (data as any[]).map((item) => ({
      ...item,
      author: item.profiles || null,
    }));
  };

  return function useArtifactList(options: ArtifactListOptions = {}) {
    const {
      searchQuery = "",
      published,
      authorId,
      teamId,
      category,
      tag,
      sortBy = "newest",
      limit,
    } = options;

    return useQuery<T[]>({
      queryKey: [
        config.queryKey,
        searchQuery,
        published,
        authorId,
        teamId,
        category,
        tag,
        sortBy,
        limit,
      ],
      enabled: hasArtifactListScope({ published, authorId, teamId }),
      queryFn: async () => {
        const trimmed = searchQuery.trim();
        // The rows this list may show, in its order, before any search: built
        // once, so the partial-match fallback asks within the same scope.
        const scoped = () => {
          let q = (supabase.from(config.table as any) as any).select(
            artifactListSelect(config.table),
          );

          if (sortBy === "rating") {
            q = q
              .order("rating_avg", { ascending: false })
              .order("rating_count", { ascending: false })
              .order("created_at", { ascending: false });
          } else {
            q = q.order("created_at", { ascending: false });
          }

          if (published !== undefined) {
            q = q.eq("published", published);
          }

          if (category && category !== "all") {
            q = q.eq("category", category);
          }

          if (tag) {
            q = q.contains("tags", [tag]);
          }

          if (teamId) {
            q = q.eq("team_id", teamId);
          } else if (authorId) {
            q = q.eq("author_id", authorId).is("team_id", null);
          }

          if (limit) {
            q = q.limit(limit);
          }
          return q;
        };

        let query = scoped();
        if (trimmed) {
          // `fts` is a stored generated column over title, description and
          // content (migration 20260908210000). PostgREST cannot filter on a
          // comma-separated list of columns; it used to read only the title.
          query = query.textSearch("fts", trimmed, {
            type: "websearch",
            config: "simple",
          });
        }

        let { data, error } = await query;
        if (error) throw error;

        // Whole words found nothing: try the words as fragments ("summar").
        if (trimmed && (data ?? []).length === 0) {
          ({ data, error } = await withPartialMatch(scoped(), trimmed));
          if (error) throw error;
        }

        const ftsResults = (data || []).map((item: any) => ({
          ...item,
          author: item.profiles || null,
        })) as T[];

        // Hybrid: append semantic-only matches for public searches
        if (published === true && searchQuery.trim().length >= 3) {
          const merged = await mergeWithSemantic(
            config.semanticType,
            searchQuery.trim(),
            ftsResults,
            fetchByIds,
            { category },
          );
          // Semantic matches are fetched by id and skip the tag filter above.
          return tag
            ? merged.filter((item) =>
                ((item as { tags?: string[] | null }).tags || []).includes(tag),
              )
            : merged;
        }

        return ftsResults;
      },
    });
  };
}
