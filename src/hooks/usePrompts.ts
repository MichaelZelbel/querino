import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Prompt, PromptAuthor } from "@/types/prompt";

export interface PromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

/**
 * Every prompt the given user authored, private ones included. The public
 * catalogue below filters on is_public, which is wrong for pickers where the
 * owner chooses among their own work. Row-level security still applies.
 */
export function useMyPrompts(userId?: string) {
  return useQuery({
    queryKey: ["prompts", "mine", userId],
    queryFn: async (): Promise<Prompt[]> => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("author_id", userId!)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []) as Prompt[];
    },
    enabled: !!userId,
  });
}

export function usePrompts() {
  return useQuery({
    queryKey: ["prompts", "public"],
    queryFn: async (): Promise<PromptWithAuthor[]> => {
      const { data, error } = await supabase
        .from("prompts")
        .select(
          `
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `,
        )
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
