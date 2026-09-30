import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Prompt, PromptAuthor } from "@/types/prompt";
import { mergeWithSemanticDetailed } from "./useSemanticMerge";
import { applyOrder, promptBrowseOrder } from "@/lib/listOrder";
import { withPartialMatch } from "@/lib/searchFallback";

export interface PromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

export type PromptSortOption = "trending" | "newest" | "rating";

interface UseSearchPromptsOptions {
  searchQuery?: string;
  isPublic?: boolean;
  userId?: string;
  /** Server-side category filter ("all" = no filter). */
  category?: string;
  /** Server-side tag filter (from /discover?tag=...). */
  tag?: string;
  /** Browse sort. Ignored while searching (relevance order wins). */
  sortBy?: PromptSortOption;
  pageSize?: number;
}

const SEARCH_RESULT_CAP = 50;

interface PromptPage {
  rows: PromptWithAuthor[];
  /** True when semantic matches were merged in (relevance-ranked search). */
  semantic: boolean;
}

async function fetchPromptsByIds(ids: string[]): Promise<PromptWithAuthor[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("prompts")
    .select(`*, profiles:author_id (id, display_name, avatar_url)`)
    .in("id", ids);
  if (error || !data) return [];
  return (data as any[]).map((item) => ({
    ...item,
    author: item.profiles || null,
    profiles: undefined,
  }));
}

/**
 * Public prompt discovery. Browsing is paginated server-side (the old
 * version downloaded every public prompt, full content included, on every
 * visit). Searching stays single-shot: FTS capped at SEARCH_RESULT_CAP,
 * plus the semantic merge for concept matches.
 */
export function useSearchPrompts({
  searchQuery,
  isPublic = true,
  userId,
  category = "all",
  tag,
  sortBy = "trending",
  pageSize = 24,
}: UseSearchPromptsOptions) {
  const trimmed = (searchQuery ?? "").trim();
  const isSearching = trimmed.length > 0;

  const query = useInfiniteQuery({
    queryKey: [
      "prompts",
      "search",
      "hybrid",
      trimmed,
      isPublic,
      userId,
      category,
      tag,
      sortBy,
      pageSize,
    ],
    initialPageParam: 0,
    getNextPageParam: (lastPage: PromptPage, allPages) => {
      if (isSearching) return undefined; // search is single-shot
      return lastPage.rows.length === pageSize ? allPages.length : undefined;
    },
    queryFn: async ({ pageParam }): Promise<PromptPage> => {
      // The rows this list may show, before any search: built once, so the
      // partial-match fallback below asks within exactly the same scope.
      const scoped = () => {
        let q = supabase
          .from("prompts")
          .select(`*, profiles:author_id (id, display_name, avatar_url)`);
        if (isPublic) {
          q = q.eq("is_public", true);
        } else if (userId) {
          q = q.eq("author_id", userId);
        }
        if (category && category !== "all") {
          q = q.eq("category", category);
        }
        if (tag) {
          q = q.contains("tags", [tag]);
        }
        return q;
      };
      let query = scoped();

      if (isSearching) {
        // 'simple' instead of 'english' so German and mixed catalogues match.
        // True semantic intelligence comes from the embedding merge below.
        // `fts` is a stored generated column over title, description and
        // content (migration 20260908210000). PostgREST cannot filter on a
        // comma-separated list of columns; it used to read only the title.
        query = query
          .textSearch("fts", trimmed, {
            type: "websearch",
            config: "simple",
          })
          .limit(SEARCH_RESULT_CAP);
      } else {
        // Every browse order ends in the primary key: with ties left in it,
        // Load more repeated prompts and skipped others (see listOrder.ts).
        query = applyOrder(query, promptBrowseOrder(sortBy));
        const from = (pageParam as number) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }

      let { data, error } = await query;
      if (error) throw new Error(error.message);

      // Whole words found nothing: try the words as fragments ("summar").
      if (isSearching && (data ?? []).length === 0) {
        ({ data, error } = await withPartialMatch(scoped(), trimmed).limit(
          SEARCH_RESULT_CAP,
        ));
        if (error) throw new Error(error.message);
      }

      const ftsResults: PromptWithAuthor[] = (data as any[]).map((item) => ({
        ...item,
        author: item.profiles || null,
        profiles: undefined,
      }));

      // Hybrid: append semantic-only matches for public searches
      if (isSearching && isPublic && trimmed.length >= 3) {
        return await mergeWithSemanticDetailed(
          "prompt",
          trimmed,
          ftsResults,
          fetchPromptsByIds,
          { category, tag },
        );
      }

      return { rows: ftsResults, semantic: false };
    },
    staleTime: 1000 * 60,
  });

  return {
    data: query.data
      ? query.data.pages.flatMap((page) => page.rows)
      : undefined,
    /** True when the current search merged in semantic (meaning) matches. */
    isSemantic: query.data?.pages.some((page) => page.semantic) ?? false,
    isLoading: query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
