import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserTeams } from "@/hooks/useTeams";
import { useUserRole } from "@/hooks/useUserRole";
import type { ArtifactListTable } from "@/lib/artifactListColumns";
import {
  canEditArtifact,
  decideEditAccess,
  PREMIUM_ROLES,
  type EditableArtifact,
  type EditAccess,
  type EditPageRow,
} from "@/lib/editAccess";

/**
 * One-shot decision for the edit pages, which load the row inside an effect
 * and decide right there what to show. The team and role lookups run only for
 * a team row the caller did not write.
 */
export async function loadEditAccess(
  table: ArtifactListTable,
  row: EditPageRow | null | undefined,
  userId: string | null | undefined,
): Promise<EditAccess> {
  const teamId = row?.team_id;
  if (!userId || !teamId || row.author_id === userId) {
    return decideEditAccess(table, row, userId, [], false);
  }

  const [membership, roles] = await Promise.all([
    supabase
      .from("team_members")
      .select("team_id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const teamIds = !membership.error && membership.data ? [teamId] : [];
  const isPremium =
    !roles.error && (roles.data ?? []).some((r) => PREMIUM_ROLES.has(r.role));
  return decideEditAccess(table, row, userId, teamIds, isPremium);
}

/** Reactive version for the detail pages' Edit buttons. */
export function useCanEditArtifact(
  artifact: EditableArtifact | null | undefined,
): boolean {
  const { user } = useAuthContext();
  const needsTeamCheck =
    !!user && !!artifact?.team_id && artifact.author_id !== user.id;
  const { data: teams } = useUserTeams();
  const { isPremium } = useUserRole();
  const teamIds = needsTeamCheck ? (teams ?? []).map((t) => t.id) : [];
  return canEditArtifact(artifact, user?.id, teamIds, isPremium);
}
