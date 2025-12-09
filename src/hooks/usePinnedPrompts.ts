import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Prompt, PromptAuthor } from "@/types/prompt";

interface PinnedPromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

export function usePinnedPrompts() {
  const { user } = useAuthContext();
  const [pinnedPromptIds, setPinnedPromptIds] = useState<Set<string>>(new Set());
  const [pinnedPrompts, setPinnedPrompts] = useState<PinnedPromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all pinned prompt IDs for the current user
  const fetchPinnedPromptIds = useCallback(async () => {
    if (!user) {
      setPinnedPromptIds(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from("prompt_pins")
        .select("prompt_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching pinned prompts:", error);
        return;
      }

      setPinnedPromptIds(new Set(data?.map((row) => row.prompt_id) || []));
    } catch (err) {
      console.error("Error fetching pinned prompts:", err);
    }
  }, [user]);

  // Fetch full pinned prompt data
  const fetchPinnedPrompts = useCallback(async () => {
    if (!user) {
      setPinnedPrompts([]);
      return;
    }

    setLoading(true);
    try {
      const { data: pins, error: pinsError } = await supabase
        .from("prompt_pins")
        .select("prompt_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pinsError) {
        console.error("Error fetching pins:", pinsError);
        setLoading(false);
        return;
      }

      if (!pins || pins.length === 0) {
        setPinnedPrompts([]);
        setLoading(false);
        return;
      }

      const promptIds = pins.map((p) => p.prompt_id);

      const { data: prompts, error: promptsError } = await supabase
        .from("prompts")
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .in("id", promptIds);

      if (promptsError) {
        console.error("Error fetching prompts:", promptsError);
        setLoading(false);
        return;
      }

      // Map prompts to maintain pin order
      const promptMap = new Map(
        (prompts || []).map((p) => [p.id, { ...p, author: (p as any).profiles || null }])
      );
      const orderedPrompts = promptIds
        .map((id) => promptMap.get(id))
        .filter(Boolean) as PinnedPromptWithAuthor[];

      setPinnedPrompts(orderedPrompts);
      setPinnedPromptIds(new Set(promptIds));
    } catch (err) {
      console.error("Error fetching pinned prompts:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPinnedPromptIds();
  }, [fetchPinnedPromptIds]);

  // Check if a specific prompt is pinned
  const isPromptPinned = useCallback(
    (promptId: string) => pinnedPromptIds.has(promptId),
    [pinnedPromptIds]
  );

  // Pin a prompt
  const pinPrompt = useCallback(
    async (promptId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      try {
        const { error } = await supabase
          .from("prompt_pins")
          .insert({ user_id: user.id, prompt_id: promptId });

        if (error) {
          if (error.code === "23505") {
            // Already pinned (unique constraint violation)
            return { error: null };
          }
          return { error };
        }

        setPinnedPromptIds((prev) => new Set([...prev, promptId]));
        console.log("Prompt pinned", { promptId });
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user]
  );

  // Unpin a prompt
  const unpinPrompt = useCallback(
    async (promptId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      try {
        const { error } = await supabase
          .from("prompt_pins")
          .delete()
          .eq("user_id", user.id)
          .eq("prompt_id", promptId);

        if (error) {
          return { error };
        }

        setPinnedPromptIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(promptId);
          return newSet;
        });
        console.log("Prompt unpinned", { promptId });
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user]
  );

  // Toggle pin state
  const togglePin = useCallback(
    async (promptId: string) => {
      if (isPromptPinned(promptId)) {
        return unpinPrompt(promptId);
      } else {
        return pinPrompt(promptId);
      }
    },
    [isPromptPinned, pinPrompt, unpinPrompt]
  );

  return {
    pinnedPromptIds,
    pinnedPrompts,
    loading,
    isPromptPinned,
    pinPrompt,
    unpinPrompt,
    togglePin,
    refetch: fetchPinnedPrompts,
    refetchIds: fetchPinnedPromptIds,
  };
}
