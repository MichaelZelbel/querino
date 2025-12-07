import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export function useSavedPrompts() {
  const { user } = useAuthContext();
  const [savedPromptIds, setSavedPromptIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch all saved prompt IDs for the current user
  const fetchSavedPrompts = useCallback(async () => {
    if (!user) {
      setSavedPromptIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_saved_prompts")
        .select("prompt_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching saved prompts:", error);
        return;
      }

      setSavedPromptIds(new Set(data?.map((row) => row.prompt_id) || []));
    } catch (err) {
      console.error("Error fetching saved prompts:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedPrompts();
  }, [fetchSavedPrompts]);

  // Check if a specific prompt is saved
  const isPromptSaved = useCallback(
    (promptId: string) => savedPromptIds.has(promptId),
    [savedPromptIds]
  );

  // Save a prompt
  const savePrompt = useCallback(
    async (promptId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      try {
        const { error } = await supabase
          .from("user_saved_prompts")
          .insert({ user_id: user.id, prompt_id: promptId });

        if (error) {
          if (error.code === "23505") {
            // Already saved (unique constraint violation)
            return { error: null };
          }
          return { error };
        }

        setSavedPromptIds((prev) => new Set([...prev, promptId]));
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user]
  );

  // Unsave a prompt
  const unsavePrompt = useCallback(
    async (promptId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      try {
        const { error } = await supabase
          .from("user_saved_prompts")
          .delete()
          .eq("user_id", user.id)
          .eq("prompt_id", promptId);

        if (error) {
          return { error };
        }

        setSavedPromptIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(promptId);
          return newSet;
        });
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user]
  );

  // Toggle save state
  const toggleSave = useCallback(
    async (promptId: string) => {
      if (isPromptSaved(promptId)) {
        return unsavePrompt(promptId);
      } else {
        return savePrompt(promptId);
      }
    },
    [isPromptSaved, savePrompt, unsavePrompt]
  );

  return {
    savedPromptIds,
    loading,
    isPromptSaved,
    savePrompt,
    unsavePrompt,
    toggleSave,
    refetch: fetchSavedPrompts,
  };
}
