import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Prompt, PromptAuthor } from "@/types/prompt";

export interface PromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

interface UseSearchPromptsOptions {
  searchQuery?: string;
  isPublic?: boolean;
  userId?: string;
}

export function useSearchPrompts({ searchQuery, isPublic = true, userId }: UseSearchPromptsOptions) {
  return useQuery({
    queryKey: ["prompts", "search", searchQuery, isPublic, userId],
    queryFn: async (): Promise<PromptWithAuthor[]> => {
      let query = supabase
        .from("prompts")
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `);

      // Apply filters based on context
      if (isPublic) {
        query = query.eq("is_public", true);
      } else if (userId) {
        query = query.eq("author_id", userId);
      }

      // If search query provided, use full-text search
      if (searchQuery && searchQuery.trim().length > 0) {
        const searchTerm = searchQuery.trim();
        // Use textSearch for full-text search
        query = query.textSearch(
          "title,short_description,content",
          searchTerm,
          { type: "websearch", config: "english" }
        );
      } else {
        // Default ordering when no search
        query = query
          .order("rating_avg", { ascending: false })
          .order("rating_count", { ascending: false })
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Transform the data to match our interface
      return (data as any[]).map((item) => ({
        ...item,
        author: item.profiles || null,
        profiles: undefined,
      }));
    },
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}
