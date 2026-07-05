import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamInvite {
  id: string;
  team_id: string;
  token: string;
  role: "member" | "admin";
  created_by: string;
  expires_at: string;
  used_count: number;
  created_at: string;
}

/** Tokens are base64 and can contain +/=, so always carry them in a query
 *  param, never a path segment. */
export function inviteUrl(token: string): string {
  return `${window.location.origin}/team/join?token=${encodeURIComponent(token)}`;
}

export function useTeamInvites(teamId: string | undefined) {
  return useQuery<TeamInvite[]>({
    queryKey: ["team_invites", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase.from("team_invites")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TeamInvite[];
    },
  });
}

export function useCreateTeamInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      userId,
      role = "member",
    }: {
      teamId: string;
      userId: string;
      role?: "member" | "admin";
    }): Promise<TeamInvite> => {
      const { data, error } = await supabase.from("team_invites")
        .insert({ team_id: teamId, created_by: userId, role })
        .select("*")
        .single();
      if (error) throw error;
      return data as TeamInvite;
    },
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team_invites", teamId] });
    },
  });
}

export function useRevokeTeamInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId }: { inviteId: string; teamId: string }) => {
      const { error } = await supabase.from("team_invites")
        .delete()
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team_invites", teamId] });
    },
  });
}

export async function redeemTeamInvite(
  token: string
): Promise<{ team_id: string; team_name: string }> {
  const { data, error } = await supabase.rpc("redeem_team_invite", {
    p_token: token,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Invite could not be redeemed");
  return row as { team_id: string; team_name: string };
}
