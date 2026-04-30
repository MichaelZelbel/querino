import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PromptKit, PromptKitAuthor } from "@/types/promptKit";
import { mergeWithSemantic } from "./useSemanticMerge";

async function fetchKitsByIds(ids: string[]): Promise<(PromptKit & { author?: PromptKitAuthor | null })[]> {
  if (ids.length === 0) return [];
  const { data, error } = await (supabase.from("prompt_kits") as any)
    .select(`*, profiles:author_id (id, display_name, avatar_url)`)
    .in("id", ids);
  if (error || !data) return [];
  return (data as any[]).map((item) => ({ ...item, author: item.profiles || null }));
}

interface UsePromptKitsOptions {
  searchQuery?: string;
  published?: boolean;
  authorId?: string;
  teamId?: string;
}

export function usePromptKits(options: UsePromptKitsOptions = {}) {
  const { searchQuery = "", published, authorId, teamId } = options;

  return useQuery({
    queryKey: ["prompt_kits", searchQuery, published, authorId, teamId],
    queryFn: async () => {
      let query = (supabase.from("prompt_kits") as any)
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (published !== undefined) {
        query = query.eq("published", published);
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
          { type: "websearch", config: "simple" },
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const ftsResults = (data || []).map((item: any) => ({
        ...item,
        author: item.profiles || null,
      })) as (PromptKit & { author?: PromptKitAuthor | null })[];

      if (published === true && searchQuery.trim().length >= 3) {
        return await mergeWithSemantic(
          "prompt_kit",
          searchQuery.trim(),
          ftsResults,
          fetchKitsByIds,
        );
      }

      return ftsResults;
    },
  });
}
