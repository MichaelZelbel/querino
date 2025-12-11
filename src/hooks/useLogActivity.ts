import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { ActivityItemType, ActivityAction } from "@/types/activity";

interface LogActivityParams {
  itemType: ActivityItemType;
  itemId: string;
  action: ActivityAction;
  metadata?: Record<string, any>;
  teamId?: string | null;
}

export function useLogActivity() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const logActivity = useCallback(async ({
    itemType,
    itemId,
    action,
    metadata = {},
    teamId,
  }: LogActivityParams) => {
    if (!user) return;

    const effectiveTeamId = teamId !== undefined 
      ? teamId 
      : (currentWorkspace !== "personal" ? currentWorkspace : null);

    try {
      const { error } = await supabase
        .from("activity_events")
        .insert({
          actor_id: user.id,
          team_id: effectiveTeamId,
          item_type: itemType,
          item_id: itemId,
          action,
          metadata,
        });

      if (error) {
        console.error("Failed to log activity:", error);
      }
    } catch (err) {
      console.error("Error logging activity:", err);
    }
  }, [user, currentWorkspace]);

  return { logActivity };
}
