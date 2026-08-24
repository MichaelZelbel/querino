import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useAuthContext } from "./router-compat-xSZ_AoUj.mjs";
import { a as useQueryClient, n as useMutation, r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as AvatarFallback$1, r as AvatarImage$1, t as Avatar$1 } from "../_libs/@radix-ui/react-avatar+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/avatar-CLMN7E0g.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useUserTeams() {
	const { user } = useAuthContext();
	return useQuery({
		queryKey: ["user-teams", user?.id],
		queryFn: async () => {
			if (!user) return [];
			const { data: memberships, error: memberError } = await supabase.from("team_members").select("team_id, role").eq("user_id", user.id);
			if (memberError) throw memberError;
			if (!memberships || memberships.length === 0) return [];
			const teamIds = memberships.map((m) => m.team_id);
			const { data: teams, error: teamsError } = await supabase.from("teams").select("*").in("id", teamIds);
			if (teamsError) throw teamsError;
			return (teams || []).map((team) => ({
				...team,
				role: memberships.find((m) => m.team_id === team.id)?.role
			}));
		},
		enabled: !!user
	});
}
function useTeam(teamId) {
	return useQuery({
		queryKey: ["team", teamId],
		queryFn: async () => {
			if (!teamId) return null;
			const { data, error } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
			if (error) throw error;
			return data;
		},
		enabled: !!teamId
	});
}
function useTeamMembers(teamId) {
	return useQuery({
		queryKey: ["team-members", teamId],
		queryFn: async () => {
			if (!teamId) return [];
			const { data: members, error: membersError } = await supabase.from("team_members").select("*").eq("team_id", teamId);
			if (membersError) throw membersError;
			if (!members || members.length === 0) return [];
			const userIds = members.map((m) => m.user_id);
			const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
			if (profilesError) throw profilesError;
			return members.map((member) => ({
				...member,
				role: member.role,
				profile: profiles?.find((p) => p.id === member.user_id)
			}));
		},
		enabled: !!teamId
	});
}
function useCreateTeam() {
	const queryClient = useQueryClient();
	const { user } = useAuthContext();
	return useMutation({
		mutationFn: async (name) => {
			if (!user) throw new Error("Not authenticated");
			const { data: team, error: teamError } = await supabase.from("teams").insert({
				name,
				owner_id: user.id
			}).select().single();
			if (teamError) throw teamError;
			const { error: memberError } = await supabase.from("team_members").insert({
				team_id: team.id,
				user_id: user.id,
				role: "owner"
			});
			if (memberError) throw memberError;
			return team;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user-teams"] });
		}
	});
}
function useUpdateTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ teamId, updates }) => {
			const { error } = await supabase.from("teams").update(updates).eq("id", teamId);
			if (error) throw error;
		},
		onSuccess: (_, { teamId }) => {
			queryClient.invalidateQueries({ queryKey: ["team", teamId] });
			queryClient.invalidateQueries({ queryKey: ["user-teams"] });
		}
	});
}
function useDeleteTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (teamId) => {
			const { error } = await supabase.from("teams").delete().eq("id", teamId);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user-teams"] });
		}
	});
}
function useUpdateTeamMemberRole() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ memberId, role }) => {
			const { error } = await supabase.from("team_members").update({ role }).eq("id", memberId);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["team-members"] });
		}
	});
}
function useRemoveTeamMember() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (memberId) => {
			const { error } = await supabase.from("team_members").delete().eq("id", memberId);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["team-members"] });
		}
	});
}
function useCurrentUserTeamRole(teamId) {
	const { user } = useAuthContext();
	return useQuery({
		queryKey: [
			"team-role",
			teamId,
			user?.id
		],
		queryFn: async () => {
			if (!teamId || !user) return null;
			const { data, error } = await supabase.from("team_members").select("role").eq("team_id", teamId).eq("user_id", user.id).maybeSingle();
			if (error) throw error;
			return data?.role;
		},
		enabled: !!teamId && !!user
	});
}
var Avatar = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar$1, {
	ref,
	className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
	...props
}));
Avatar.displayName = Avatar$1.displayName;
var AvatarImage = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage$1, {
	ref,
	className: cn("aspect-square h-full w-full", className),
	...props
}));
AvatarImage.displayName = AvatarImage$1.displayName;
var AvatarFallback = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback$1, {
	ref,
	className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
	...props
}));
AvatarFallback.displayName = AvatarFallback$1.displayName;
//#endregion
export { useCurrentUserTeamRole as a, useTeam as c, useUpdateTeamMemberRole as d, useUserTeams as f, useCreateTeam as i, useTeamMembers as l, AvatarFallback as n, useDeleteTeam as o, AvatarImage as r, useRemoveTeamMember as s, Avatar as t, useUpdateTeam as u };
