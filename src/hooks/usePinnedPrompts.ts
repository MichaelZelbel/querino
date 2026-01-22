import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Prompt, PromptAuthor } from "@/types/prompt";

interface PinnedPromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

interface UsePinnedPromptsOptions {
  /** If provided, only return pinned prompts belonging to this team */
  teamId?: string | null;
  /** If true and teamId is null/undefined, only return personal (non-team) pinned prompts */
  personalOnly?: boolean;
}

export function usePinnedPrompts(options: UsePinnedPromptsOptions = {}) {
  const { user } = useAuthContext();
  const { teamId, personalOnly } = options;
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

  // Fetch full pinned prompt data with optional workspace filtering
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

      // Build the query with workspace filtering
      let query = supabase
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

      // Apply workspace filter
      if (teamId) {
        // Team workspace: only show prompts belonging to this team
        query = query.eq("team_id", teamId);
      } else if (personalOnly) {
        // Personal workspace: only show prompts without a team
        query = query.is("team_id", null);
      }
      // If neither teamId nor personalOnly, return all pinned prompts (no filter)

      const { data: prompts, error: promptsError } = await query;

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
      // Keep pinnedPromptIds as all pins (for checking if a prompt is pinned)
      setPinnedPromptIds(new Set(pins.map(p => p.prompt_id)));
    } catch (err) {
      console.error("Error fetching pinned prompts:", err);
    } finally {
      setLoading(false);
    }
  }, [user, teamId, personalOnly]);
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
