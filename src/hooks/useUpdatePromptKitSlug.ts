import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UpdateSlugResult {
  slug?: string;
  changed?: boolean;
  error?: string;
}

export function useUpdatePromptKitSlug() {
  const [updating, setUpdating] = useState(false);

  const updateSlug = async (
    promptKitId: string,
    newSlug: string,
    userId: string
  ): Promise<UpdateSlugResult> => {
    setUpdating(true);
    try {
      const { data, error } = await (supabase.rpc as any)("update_prompt_kit_slug", {
        p_prompt_kit_id: promptKitId,
        p_new_slug: newSlug,
        p_user_id: userId,
      });

      if (error) throw error;

      return data as unknown as UpdateSlugResult;
    } catch (err) {
      console.error("Error updating prompt kit slug:", err);
      return { error: "Failed to update slug. Please try again." };
    } finally {
      setUpdating(false);
    }
  };

  return { updateSlug, updating };
}
