import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UpdateSlugResult {
  slug?: string;
  changed?: boolean;
  error?: string;
}

export function useUpdatePromptSlug() {
  const [updating, setUpdating] = useState(false);

  const updateSlug = async (
    promptId: string,
    newSlug: string,
    userId: string
  ): Promise<UpdateSlugResult> => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc("update_prompt_slug", {
        p_prompt_id: promptId,
        p_new_slug: newSlug,
        p_user_id: userId,
      });

      if (error) throw error;

      const result = data as unknown as UpdateSlugResult;
      return result;
    } catch (err) {
      console.error("Error updating slug:", err);
      return { error: "Failed to update slug. Please try again." };
    } finally {
      setUpdating(false);
    }
  };

  return { updateSlug, updating };
}
