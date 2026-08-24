import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { a as useQueryClient, n as useMutation, r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useTeamInvites-B6EE7bcl.js
/** Tokens are base64 and can contain +/=, so always carry them in a query
*  param, never a path segment. */
function inviteUrl(token) {
	return `${window.location.origin}/team/join?token=${encodeURIComponent(token)}`;
}
function useTeamInvites(teamId) {
	return useQuery({
		queryKey: ["team_invites", teamId],
		enabled: !!teamId,
		queryFn: async () => {
			const { data, error } = await supabase.from("team_invites").select("*").eq("team_id", teamId).order("created_at", { ascending: false });
			if (error) throw error;
			return data || [];
		}
	});
}
function useCreateTeamInvite() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ teamId, userId, role = "member" }) => {
			const { data, error } = await supabase.from("team_invites").insert({
				team_id: teamId,
				created_by: userId,
				role
			}).select("*").single();
			if (error) throw error;
			return data;
		},
		onSuccess: (_data, { teamId }) => {
			queryClient.invalidateQueries({ queryKey: ["team_invites", teamId] });
		}
	});
}
function useRevokeTeamInvite() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ inviteId }) => {
			const { error } = await supabase.from("team_invites").delete().eq("id", inviteId);
			if (error) throw error;
		},
		onSuccess: (_data, { teamId }) => {
			queryClient.invalidateQueries({ queryKey: ["team_invites", teamId] });
		}
	});
}
async function redeemTeamInvite(token) {
	const { data, error } = await supabase.rpc("redeem_team_invite", { p_token: token });
	if (error) throw error;
	const row = Array.isArray(data) ? data[0] : data;
	if (!row) throw new Error("Invite could not be redeemed");
	return row;
}
//#endregion
export { useTeamInvites as a, useRevokeTeamInvite as i, redeemTeamInvite as n, useCreateTeamInvite as r, inviteUrl as t };
