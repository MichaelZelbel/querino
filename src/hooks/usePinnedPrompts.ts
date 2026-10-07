import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { artifactListSelect } from "@/lib/artifactListColumns";
import { PROMPT_PINS_KEY } from "@/lib/invalidateArtifactQueries";
import type { Prompt, PromptAuthor } from "@/types/prompt";

interface PinnedPromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

interface UsePinnedPromptsOptions {
  /** If provided, only return pinned prompts belonging to this team */
  teamId?: string | null;
  /** If true and teamId is null/undefined, only return personal (non-team) pinned prompts */
  personalOnly?: boolean;
  /** Also load the pinned prompts themselves (the Library); a detail page
   *  only asks whether one prompt is pinned. */
  withPrompts?: boolean;
}

// Shared with invalidateArtifactQueries, which refreshes the pins whenever a
// prompt is edited or deleted.
const PINS_KEY = PROMPT_PINS_KEY;
const NO_PROMPTS: PinnedPromptWithAuthor[] = [];

/**
 * The user's pinned prompts, through the query cache since 2026-10-07. It used
 * to be component state filled by hand: nothing cancelled a load, so switching
 * workspace mid-load let the old workspace's pins land under the new one, and
 * a failed load only logged to the console, so the Library showed it as "no
 * pins". Each workspace now has its own query key, a superseded request is
 * aborted, and a failure is an error the Library reports.
 */
export function usePinnedPrompts(options: UsePinnedPromptsOptions = {}) {
  const { user } = useAuthContext();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { teamId, personalOnly = false, withPrompts = false } = options;

  // Every pin, whatever the workspace: "is this prompt pinned" asks this.
  const idsQuery = useQuery({
    queryKey: [PINS_KEY, userId, "ids"],
    enabled: !!userId,
    queryFn: async ({ signal }): Promise<string[]> => {
      const { data, error } = await supabase
        .from("prompt_pins")
        .select("prompt_id")
        .eq("user_id", userId!)
        .abortSignal(signal);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.prompt_id);
    },
  });

  const promptsQuery = useQuery({
    queryKey: [PINS_KEY, userId, "prompts", teamId ?? null, personalOnly],
    enabled: !!userId && withPrompts,
    queryFn: async ({ signal }): Promise<PinnedPromptWithAuthor[]> => {
      const { data: pins, error: pinsError } = await supabase
        .from("prompt_pins")
        .select("prompt_id, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .abortSignal(signal);
      if (pinsError) throw new Error(pinsError.message);
      if (!pins || pins.length === 0) return [];

      const promptIds = pins.map((p) => p.prompt_id);
      let query = supabase
        .from("prompts")
        .select(artifactListSelect("prompts"))
        .in("id", promptIds);
      if (teamId) {
        // Team workspace: only show prompts belonging to this team
        query = query.eq("team_id", teamId);
      } else if (personalOnly) {
        // Personal workspace: only show prompts without a team
        query = query.is("team_id", null);
      }
      // If neither teamId nor personalOnly, return all pinned prompts (no filter)

      const { data: prompts, error: promptsError } =
        await query.abortSignal(signal);
      if (promptsError) throw new Error(promptsError.message);

      // In pin order, newest pin first.
      const promptMap = new Map(
        ((prompts ?? []) as unknown as Record<string, unknown>[]).map((p) => [
          p.id as string,
          { ...p, author: p.profiles || null } as PinnedPromptWithAuthor,
        ]),
      );
      return promptIds
        .map((id) => promptMap.get(id))
        .filter((p): p is PinnedPromptWithAuthor => !!p);
    },
  });

  const pinnedIdList = userId ? idsQuery.data : undefined;
  const pinnedPromptIds = useMemo(
    () => new Set(pinnedIdList ?? []),
    [pinnedIdList],
  );
  const pinnedPrompts =
    userId && withPrompts ? (promptsQuery.data ?? NO_PROMPTS) : NO_PROMPTS;

  // Check if a specific prompt is pinned
  const isPromptPinned = useCallback(
    (promptId: string) => pinnedPromptIds.has(promptId),
    [pinnedPromptIds],
  );

  // The button answers at once from the ids; the pinned list itself refetches.
  const applyPinChange = useCallback(
    (promptId: string, pinned: boolean) => {
      queryClient.setQueryData<string[]>([PINS_KEY, userId, "ids"], (old) => {
        const rest = (old ?? []).filter((id) => id !== promptId);
        return pinned ? [...rest, promptId] : rest;
      });
      void queryClient.invalidateQueries({
        queryKey: [PINS_KEY, userId, "prompts"],
      });
    },
    [queryClient, userId],
  );

  // Pin a prompt
  const pinPrompt = useCallback(
    async (promptId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      try {
        const { error } = await supabase
          .from("prompt_pins")
          .insert({ user_id: user.id, prompt_id: promptId });

        // 23505: already pinned (for example from another tab). Mark it pinned
        // here too, or the button keeps offering "Pin" for a pinned prompt;
        // useSavedPrompts had the same bug and the same fix.
        if (error && error.code !== "23505") return { error };

        applyPinChange(promptId, true);
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user, applyPinChange],
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

        applyPinChange(promptId, false);
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user, applyPinChange],
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
    [isPromptPinned, pinPrompt, unpinPrompt],
  );

  const { refetch: refetchIdsQuery } = idsQuery;
  const { refetch: refetchPromptsQuery } = promptsQuery;
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchIdsQuery(),
      withPrompts ? refetchPromptsQuery() : undefined,
    ]);
  }, [refetchIdsQuery, refetchPromptsQuery, withPrompts]);
  const refetchIds = useCallback(async () => {
    await refetchIdsQuery();
  }, [refetchIdsQuery]);

  return {
    pinnedPromptIds,
    pinnedPrompts,
    loading: idsQuery.isLoading || promptsQuery.isLoading,
    /** A failed load, so the Library does not show it as "no pins". */
    error: (idsQuery.error ?? promptsQuery.error ?? null) as Error | null,
    isPromptPinned,
    pinPrompt,
    unpinPrompt,
    togglePin,
    refetch,
    refetchIds,
  };
}
