import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Prompt, PromptAuthor } from "@/types/prompt";
import { mergeWithSemantic } from "./useSemanticMerge";

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
    queryKey: ["prompts", "search", "hybrid", trimmed, isPublic, userId, category, tag, sortBy, pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage: PromptWithAuthor[], allPages) => {
      if (isSearching) return undefined; // search is single-shot
      return lastPage.length === pageSize ? allPages.length : undefined;
    },
    queryFn: async ({ pageParam }): Promise<PromptWithAuthor[]> => {
      let query = supabase
        .from("prompts")
        .select(`*, profiles:author_id (id, display_name, avatar_url)`);

      if (isPublic) {
        query = query.eq("is_public", true);
      } else if (userId) {
        query = query.eq("author_id", userId);
      }

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      if (tag) {
        query = query.contains("tags", [tag]);
      }

      if (isSearching) {
        // 'simple' instead of 'english' — works for German/multilingual.
        // True semantic intelligence comes from the embedding merge below.
        query = query
          .textSearch("title,description,content", trimmed, {
            type: "websearch",
            config: "simple",
          })
          .limit(SEARCH_RESULT_CAP);
      } else {
        switch (sortBy) {
          case "newest":
            query = query.order("created_at", { ascending: false });
            break;
          case "rating":
            query = query
              .order("rating_avg", { ascending: false })
              .order("rating_count", { ascending: false });
            break;
          case "trending":
          default:
            query = query
              .order("copies_count", { ascending: false, nullsFirst: false })
              .order("rating_avg", { ascending: false })
              .order("created_at", { ascending: false });
            break;
        }
        const from = (pageParam as number) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const ftsResults: PromptWithAuthor[] = (data as any[]).map((item) => ({
        ...item,
        author: item.profiles || null,
        profiles: undefined,
      }));

      // Hybrid: append semantic-only matches for public searches
      if (isSearching && isPublic && trimmed.length >= 3) {
        return await mergeWithSemantic("prompt", trimmed, ftsResults, fetchPromptsByIds);
      }

      return ftsResults;
    },
    staleTime: 1000 * 60,
  });

  return {
    data: query.data ? query.data.pages.flat() : undefined,
    isLoading: query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
