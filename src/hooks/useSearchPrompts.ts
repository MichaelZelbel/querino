import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Prompt, PromptAuthor } from "@/types/prompt";
import { mergeWithSemantic } from "./useSemanticMerge";

export interface PromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

interface UseSearchPromptsOptions {
  searchQuery?: string;
  isPublic?: boolean;
  userId?: string;
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

export function useSearchPrompts({ searchQuery, isPublic = true, userId }: UseSearchPromptsOptions) {
  return useQuery({
    queryKey: ["prompts", "search", "hybrid", searchQuery, isPublic, userId],
    queryFn: async (): Promise<PromptWithAuthor[]> => {
      let query = supabase
        .from("prompts")
        .select(`*, profiles:author_id (id, display_name, avatar_url)`);

      if (isPublic) {
        query = query.eq("is_public", true);
      } else if (userId) {
        query = query.eq("author_id", userId);
      }

      const trimmed = (searchQuery ?? "").trim();
      if (trimmed.length > 0) {
        // 'simple' instead of 'english' — works for German/multilingual.
        // True semantic intelligence comes from the embedding merge below.
        query = query.textSearch(
          "title,description,content",
          trimmed,
          { type: "websearch", config: "simple" }
        );
      } else {
        query = query
          .order("rating_avg", { ascending: false })
          .order("rating_count", { ascending: false })
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const ftsResults: PromptWithAuthor[] = (data as any[]).map((item) => ({
        ...item,
        author: item.profiles || null,
        profiles: undefined,
      }));

      // Hybrid: append semantic-only matches for public searches
      if (isPublic && trimmed.length >= 3) {
        return await mergeWithSemantic(
          "prompt",
          trimmed,
          ftsResults,
          fetchPromptsByIds,
        );
      }

      return ftsResults;
    },
    staleTime: 1000 * 60,
  });
}
