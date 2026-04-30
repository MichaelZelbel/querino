import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export function usePinnedPromptKits() {
  const { user } = useAuthContext();
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const fetchIds = useCallback(async () => {
    if (!user) {
      setPinnedIds(new Set());
      return;
    }
    const { data, error } = await (supabase as any)
      .from("prompt_kit_pins")
      .select("prompt_kit_id")
      .eq("user_id", user.id);
    if (error) {
      console.error("Error fetching prompt kit pins:", error);
      return;
    }
    setPinnedIds(new Set((data || []).map((row: any) => row.prompt_kit_id)));
  }, [user]);

  useEffect(() => {
    fetchIds();
  }, [fetchIds]);

  const isPinned = useCallback((kitId: string) => pinnedIds.has(kitId), [pinnedIds]);

  const pin = useCallback(
    async (kitId: string) => {
      if (!user) return { error: new Error("Not authenticated") };
      const { error } = await (supabase as any)
        .from("prompt_kit_pins")
        .insert({ user_id: user.id, prompt_kit_id: kitId });
      if (error && error.code !== "23505") return { error };
      setPinnedIds((prev) => new Set([...prev, kitId]));
      return { error: null };
    },
    [user],
  );

  const unpin = useCallback(
    async (kitId: string) => {
      if (!user) return { error: new Error("Not authenticated") };
      const { error } = await (supabase as any)
        .from("prompt_kit_pins")
        .delete()
        .eq("user_id", user.id)
        .eq("prompt_kit_id", kitId);
      if (error) return { error };
      setPinnedIds((prev) => {
        const next = new Set(prev);
        next.delete(kitId);
        return next;
      });
      return { error: null };
    },
    [user],
  );

  const togglePin = useCallback(
    async (kitId: string) => (isPinned(kitId) ? unpin(kitId) : pin(kitId)),
    [isPinned, pin, unpin],
  );

  return { pinnedIds, isPinned, pin, unpin, togglePin, refetch: fetchIds };
}
