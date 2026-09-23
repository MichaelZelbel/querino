import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserTeams } from "@/hooks/useTeams";
import { useUserRole } from "@/hooks/useUserRole";

// Who may edit or delete an artifact, mirroring the row-level security on
// prompts, skills, workflows and prompt_kits: the author, or a premium member
// of the team the artifact belongs to ("Premium team members can update team
// ..." / "... can delete team ..."). Premium means a user_roles row of
// premium, premium_gift or admin (public.is_premium_user). Until 2026-09-23
// the pages checked only author_id, so a teammate the database would let edit
// was turned away by the UI.

const PREMIUM_ROLES = new Set(["premium", "premium_gift", "admin"]);

export interface EditableArtifact {
  author_id?: string | null;
  team_id?: string | null;
}

export function canEditArtifact(
  artifact: EditableArtifact | null | undefined,
  userId: string | null | undefined,
  teamIds: readonly string[],
  isPremium: boolean,
): boolean {
  if (!artifact || !userId) return false;
  if (artifact.author_id === userId) return true;
  return !!artifact.team_id && isPremium && teamIds.includes(artifact.team_id);
}

/**
 * One-shot check for the edit pages, which load the row inside an effect and
 * decide right there whether to show the editor.
 */
export async function userCanEditArtifact(
  artifact: EditableArtifact | null | undefined,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!artifact || !userId) return false;
  if (artifact.author_id === userId) return true;
  if (!artifact.team_id) return false;

  const [membership, roles] = await Promise.all([
    supabase
      .from("team_members")
      .select("team_id")
      .eq("team_id", artifact.team_id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (membership.error || roles.error || !membership.data) return false;
  return (roles.data ?? []).some((r) => PREMIUM_ROLES.has(r.role));
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
