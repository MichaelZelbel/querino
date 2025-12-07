import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Prompt, PromptAuthor } from "@/types/prompt";

export interface PromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

export function usePrompts() {
  return useQuery({
    queryKey: ["prompts", "public"],
    queryFn: async (): Promise<PromptWithAuthor[]> => {
      const { data, error } = await supabase
        .from("prompts")
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("is_public", true)
        .order("rating_avg", { ascending: false })
        .order("rating_count", { ascending: false })
        .order("created_at", { ascending: false });

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
  });
}
