import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Team, TeamMember, TeamMemberWithProfile, TeamWithRole } from "@/types/team";

export function useUserTeams() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["user-teams", user?.id],
    queryFn: async (): Promise<TeamWithRole[]> => {
      if (!user) return [];

      const { data: memberships, error: memberError } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id);

      if (memberError) throw memberError;
      if (!memberships || memberships.length === 0) return [];

      const teamIds = memberships.map((m) => m.team_id);
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds);

      if (teamsError) throw teamsError;

      return (teams || []).map((team) => ({
        ...team,
        role: memberships.find((m) => m.team_id === team.id)?.role as 'owner' | 'admin' | 'member',
      }));
    },
    enabled: !!user,
  });
}

export function useTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: async (): Promise<Team | null> => {
      if (!teamId) return null;

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async (): Promise<TeamMemberWithProfile[]> => {
      if (!teamId) return [];

      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      return members.map((member) => ({
        ...member,
        role: member.role as 'owner' | 'admin' | 'member',
        profile: profiles?.find((p) => p.id === member.user_id),
      }));
    },
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (name: string): Promise<Team> => {
      if (!user) throw new Error("Not authenticated");

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ name, owner_id: user.id })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add owner as team member
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: user.id, role: "owner" });

      if (memberError) throw memberError;

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      updates,
    }: {
      teamId: string;
      updates: Partial<Pick<Team, "name" | "github_repo" | "github_branch" | "github_folder">>;
    }) => {
      const { error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", teamId);

      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      email,
      role,
    }: {
      teamId: string;
      email: string;
      role: "admin" | "member";
    }) => {
      // Find user by email (search in profiles by looking up auth.users indirectly)
      // Since we can't query auth.users directly, we'll need an edge function or different approach
      // For MVP, we'll search by display_name or use a workaround
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .limit(100);

      if (profileError) throw profileError;

      // For MVP, just throw an error - in production you'd use an edge function
      throw new Error("Invite by email requires an edge function. For now, please share your team ID with the user.");
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });
}

export function useAddTeamMemberById() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      userId,
      role,
    }: {
      teamId: string;
      userId: string;
      role: "admin" | "member";
    }) => {
      const { error } = await supabase
        .from("team_members")
        .insert({ team_id: teamId, user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });
}

export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: "admin" | "member";
    }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useCurrentUserTeamRole(teamId: string | undefined) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["team-role", teamId, user?.id],
    queryFn: async (): Promise<'owner' | 'admin' | 'member' | null> => {
      if (!teamId || !user) return null;

      const { data, error } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.role as 'owner' | 'admin' | 'member' | null;
    },
    enabled: !!teamId && !!user,
  });
}
