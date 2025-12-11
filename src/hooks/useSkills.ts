import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Skill, SkillAuthor } from "@/types/skill";

interface UseSkillsOptions {
  searchQuery?: string;
  published?: boolean;
  authorId?: string;
  teamId?: string;
}

export function useSkills(options: UseSkillsOptions = {}) {
  const { searchQuery = "", published, authorId, teamId } = options;

  return useQuery({
    queryKey: ["skills", searchQuery, published, authorId, teamId],
    queryFn: async () => {
      let query = (supabase
        .from("skills") as any)
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
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map((item: any) => ({
        ...item,
        author: item.profiles || null,
      })) as (Skill & { author?: SkillAuthor | null })[];
    },
  });
}
