import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mergeWithSemanticDetailed } from "./useSemanticMerge";
import { hasArtifactListScope } from "@/lib/artifactListScope";
import { withPartialMatch } from "@/lib/searchFallback";
import {
  artifactListSelect,
  type ArtifactListTable,
} from "@/lib/artifactListColumns";
import { applyOrder, type BrowseSort, type OrderTerm } from "@/lib/listOrder";

export type ArtifactSortOption = BrowseSort;

export interface ArtifactListOptions {
  searchQuery?: string;
  /** The public catalogue (the table's own public column, see the config). */
  published?: boolean;
  authorId?: string;
  teamId?: string;
  /** Server-side category filter (undefined/"all" = no filter). */
  category?: string;
  /** Server-side tag filter: only rows whose tags array contains this tag. */
  tag?: string;
  /** Browse sort. A search is ordered the same way before it is capped. */
  sortBy?: ArtifactSortOption;
  /** Rows per page; "Load more" fetches the next page. Public discovery
   *  surfaces pass this so a growing catalog can't turn every page view into
   *  a full-table download. Without it the list comes whole in one request
   *  (the Library, which filters and sorts in the browser). */
  limit?: number;
}

interface ArtifactListConfig {
  /** Supabase table, e.g. "skills" */
  table: ArtifactListTable;
  /** TanStack query-key prefix, e.g. ["skills"]. */
  queryKey: readonly string[];
  /** Semantic-search RPC family (see useSemanticMerge) */
  semanticType: "prompt" | "skill" | "workflow" | "prompt_kit";
  /** The column that makes a row public: prompts say is_public. */
  publicColumn: "is_public" | "published";
  /** Browse orders, each ending in the primary key (listOrder.ts). */
  browseOrder: (sort: ArtifactSortOption) => OrderTerm[];
  /** Most keyword matches a search asks for. Defaults to the page size. */
  searchCap?: number;
}

interface ArtifactPage<T> {
  rows: T[];
  /** True when semantic matches were merged in (relevance-ranked search). */
  semantic: boolean;
}

export interface ArtifactListResult<T> {
  data: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  isFetchingNextPage: boolean;
  /** True when the current search merged in semantic (meaning) matches. */
  isSemantic: boolean;
}

const withAuthor = <T>(item: Record<string, unknown>): T =>
  ({ ...item, author: item.profiles || null }) as T;

/**
 * The one list-hook factory for the four artifact types (2026-10-07). Prompts
 * had their own copy in useSearchPrompts, and the two had drifted: prompts
 * paged with "Load more" while Discover cut skills, workflows and kits at 60
 * rows with no way to see the rest, and a prompt search took 50 matches with
 * no order at all, so which 50 was up to Postgres. Every type now pages the
 * same way (.range() over an order ending in the primary key), searches the
 * same way (keywords, then fragments, then meaning) and differs only in its
 * config. useSkills, useWorkflows, usePromptKits and useSearchPrompts are thin
 * wrappers around this.
 */
export function createArtifactListHook<T extends { id: string }>(
  config: ArtifactListConfig,
) {
  const fetchByIds = async (ids: string[]): Promise<T[]> => {
    if (ids.length === 0) return [];
    const { data, error } = await (supabase.from(config.table as never) as any)
      .select(artifactListSelect(config.table))
      .in("id", ids);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((item) =>
      withAuthor<T>(item),
    );
  };

  return function useArtifactList(
    options: ArtifactListOptions = {},
  ): ArtifactListResult<T> {
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
    const trimmed = searchQuery.trim();
    const isSearching = trimmed.length > 0;
    const searchCap = config.searchCap ?? limit;

    const query = useInfiniteQuery({
      queryKey: [
        ...config.queryKey,
        trimmed,
        published,
        authorId,
        teamId,
        category,
        tag,
        sortBy,
        limit,
      ],
      enabled: hasArtifactListScope({ published, authorId, teamId }),
      initialPageParam: 0,
      // A search is one request; so is a list without a page size.
      getNextPageParam: (lastPage: ArtifactPage<T>, allPages) =>
        !isSearching && limit && lastPage.rows.length === limit
          ? allPages.length
          : undefined,
      queryFn: async ({ pageParam }): Promise<ArtifactPage<T>> => {
        // The rows this list may show, in its order, before any search: built
        // once, so the partial-match fallback asks within the same scope.
        const scoped = () => {
          let q = (supabase.from(config.table as never) as any).select(
            artifactListSelect(config.table),
          );
          if (published !== undefined) {
            q = q.eq(config.publicColumn, published);
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
          return applyOrder(q, config.browseOrder(sortBy));
        };

        let request = scoped();
        if (isSearching) {
          // `fts` is a stored generated column over title, description and
          // content (migration 20260908210000). 'simple' instead of 'english'
          // so German and mixed catalogues match; meaning comes from the
          // semantic merge below.
          request = request.textSearch("fts", trimmed, {
            type: "websearch",
            config: "simple",
          });
          if (searchCap) request = request.limit(searchCap);
        } else if (limit) {
          const from = (pageParam as number) * limit;
          request = request.range(from, from + limit - 1);
        }

        let { data, error } = await request;
        if (error) throw new Error(error.message);

        // Whole words found nothing: try the words as fragments ("summar").
        if (isSearching && (data ?? []).length === 0) {
          let fallback = withPartialMatch(scoped(), trimmed);
          if (searchCap) fallback = fallback.limit(searchCap);
          ({ data, error } = await fallback);
          if (error) throw new Error(error.message);
        }

        const rows = ((data ?? []) as Record<string, unknown>[]).map((item) =>
          withAuthor<T>(item),
        );

        // Hybrid: append semantic-only matches for public searches. The RPC
        // ignores the filters, so the merge drops rows outside them.
        if (isSearching && published === true && trimmed.length >= 3) {
          return mergeWithSemanticDetailed(
            config.semanticType,
            trimmed,
            rows,
            fetchByIds,
            { category, tag },
          );
        }

        return { rows, semantic: false };
      },
    });

    // One array per fetched result, so the Library's memoised filters and
    // anything keyed on the list do not run again on every render.
    const pages = query.data?.pages;
    const data = useMemo(
      () => (pages ? pages.flatMap((page) => page.rows) : undefined),
      [pages],
    );

    return {
      data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
      hasNextPage: query.hasNextPage,
      fetchNextPage: query.fetchNextPage,
      isFetchingNextPage: query.isFetchingNextPage,
      isSemantic: pages?.some((page) => page.semantic) ?? false,
    };
  };
}
