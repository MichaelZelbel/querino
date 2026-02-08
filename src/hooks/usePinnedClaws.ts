import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Claw, ClawAuthor } from "@/types/claw";

interface PinnedClawWithAuthor extends Claw {
  author?: ClawAuthor | null;
}

interface UsePinnedClawsOptions {
  /** If provided, only return pinned claws belonging to this team */
  teamId?: string | null;
  /** If true and teamId is null/undefined, only return personal (non-team) pinned claws */
  personalOnly?: boolean;
}

export function usePinnedClaws(options: UsePinnedClawsOptions = {}) {
  const { user } = useAuthContext();
  const { teamId, personalOnly } = options;
  const [pinnedClawIds, setPinnedClawIds] = useState<Set<string>>(new Set());
  const [pinnedClaws, setPinnedClaws] = useState<PinnedClawWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all pinned claw IDs for the current user
  const fetchPinnedClawIds = useCallback(async () => {
    if (!user) {
      setPinnedClawIds(new Set());
      return;
    }

    try {
      const { data, error } = await (supabase
        .from("claw_pins") as any)
        .select("claw_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching pinned claws:", error);
        return;
      }

      setPinnedClawIds(new Set(data?.map((row: any) => row.claw_id) || []));
    } catch (err) {
      console.error("Error fetching pinned claws:", err);
    }
  }, [user]);

  // Fetch full pinned claw data with optional workspace filtering
  const fetchPinnedClaws = useCallback(async () => {
    if (!user) {
      setPinnedClaws([]);
      return;
    }

    setLoading(true);
    try {
      const { data: pins, error: pinsError } = await (supabase
        .from("claw_pins") as any)
        .select("claw_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pinsError) {
        console.error("Error fetching pins:", pinsError);
        setLoading(false);
        return;
      }

      if (!pins || pins.length === 0) {
        setPinnedClaws([]);
        setLoading(false);
        return;
      }

      const clawIds = pins.map((p: any) => p.claw_id);

      // Build the query with workspace filtering
      let query = (supabase
        .from("claws") as any)
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .in("id", clawIds);

      // Apply workspace filter
      if (teamId) {
        query = query.eq("team_id", teamId);
      } else if (personalOnly) {
        query = query.is("team_id", null);
      }

      const { data: claws, error: clawsError } = await query;

      if (clawsError) {
        console.error("Error fetching claws:", clawsError);
        setLoading(false);
        return;
      }

      // Map claws to maintain pin order
      const clawMap = new Map(
        (claws || []).map((c: any) => [c.id, { ...c, author: c.profiles || null }])
      );
      const orderedClaws = clawIds
        .map((id: string) => clawMap.get(id))
        .filter(Boolean) as PinnedClawWithAuthor[];

      setPinnedClaws(orderedClaws);
      setPinnedClawIds(new Set(pins.map((p: any) => p.claw_id)));
    } catch (err) {
      console.error("Error fetching pinned claws:", err);
    } finally {
      setLoading(false);
    }
  }, [user, teamId, personalOnly]);

  useEffect(() => {
    fetchPinnedClawIds();
  }, [fetchPinnedClawIds]);

  // Check if a specific claw is pinned
  const isClawPinned = useCallback(
    (clawId: string) => pinnedClawIds.has(clawId),
    [pinnedClawIds]
  );

  // Pin a claw
  const pinClaw = useCallback(
    async (clawId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      try {
        const { error } = await (supabase
          .from("claw_pins") as any)
          .insert({ user_id: user.id, claw_id: clawId });

        if (error) {
          if (error.code === "23505") {
            return { error: null };
          }
          return { error };
        }

        setPinnedClawIds((prev) => new Set([...prev, clawId]));
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user]
  );

  // Unpin a claw
  const unpinClaw = useCallback(
    async (clawId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      try {
        const { error } = await (supabase
          .from("claw_pins") as any)
          .delete()
          .eq("user_id", user.id)
          .eq("claw_id", clawId);

        if (error) {
          return { error };
        }

        setPinnedClawIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(clawId);
          return newSet;
        });
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user]
  );

  // Toggle pin state
  const togglePin = useCallback(
    async (clawId: string) => {
      if (isClawPinned(clawId)) {
        return unpinClaw(clawId);
      } else {
        return pinClaw(clawId);
      }
    },
    [isClawPinned, pinClaw, unpinClaw]
  );

  return {
    pinnedClawIds,
    pinnedClaws,
    loading,
    isClawPinned,
    pinClaw,
    unpinClaw,
    togglePin,
    refetch: fetchPinnedClaws,
    refetchIds: fetchPinnedClawIds,
  };
}
