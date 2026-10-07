import type { Prompt, PromptAuthor } from "@/types/prompt";
import { createArtifactListHook } from "./useArtifactList";
import { promptBrowseOrder } from "@/lib/listOrder";

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
  /** Browse sort; a search is ordered the same way before it is capped. */
  sortBy?: PromptSortOption;
  pageSize?: number;
}

// A search is one request of at most this many keyword matches, plus the
// semantic ones. Browsing pages by pageSize.
const SEARCH_RESULT_CAP = 50;

// The key keeps its old prefix: PromptsSection retries through
// ["prompts", "search", "hybrid"], and invalidateArtifactQueries reaches it
// through ["prompts"].
const usePromptList = createArtifactListHook<PromptWithAuthor>({
  table: "prompts",
  queryKey: ["prompts", "search", "hybrid"],
  semanticType: "prompt",
  publicColumn: "is_public",
  browseOrder: promptBrowseOrder,
  searchCap: SEARCH_RESULT_CAP,
});

/**
 * Public prompt discovery (Discover's prompts tab and the home page), on the
 * shared list factory since 2026-10-07 (useArtifactList.ts). Browsing pages
 * with "Load more"; searching is keywords, then fragments, then meaning.
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
  const list = usePromptList({
    searchQuery,
    published: isPublic ? true : undefined,
    authorId: isPublic ? undefined : userId,
    category,
    tag,
    sortBy,
    limit: pageSize,
  });

  return {
    data: list.data,
    isSemantic: list.isSemantic,
    isLoading: list.isLoading,
    error: list.error,
    hasNextPage: list.hasNextPage,
    fetchNextPage: list.fetchNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    refetch: list.refetch,
  };
}
