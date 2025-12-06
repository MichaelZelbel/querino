import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Prompt } from "@/types/prompt";

export function usePrompts() {
  return useQuery({
    queryKey: ["prompts", "public"],
    queryFn: async (): Promise<Prompt[]> => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("is_public", true)
        .order("rating_avg", { ascending: false })
        .order("rating_count", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Prompt[];
    },
  });
}
