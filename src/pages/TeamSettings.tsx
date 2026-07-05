import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, UserPlus, Crown, Shield, User as UserIcon, Activity, Link as LinkIcon, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTeamInvites, useCreateTeamInvite, useRevokeTeamInvite, inviteUrl } from "@/hooks/useTeamInvites";
import { format } from "date-fns";
import {
  useTeam,
  useTeamMembers,
  useUpdateTeam,
  useDeleteTeam,
  useCurrentUserTeamRole,
  useUpdateTeamMemberRole,
  useRemoveTeamMember,
} from "@/hooks/useTeams";
import { toast } from "sonner";

export default function TeamSettings() {
  const { id: teamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(teamId);
  const { data: userRole } = useCurrentUserTeamRole(teamId);
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const updateMemberRole = useUpdateTeamMemberRole();
  const removeMember = useRemoveTeamMember();
  const { data: invites = [] } = useTeamInvites(teamId);
  const createInvite = useCreateTeamInvite();
  const revokeInvite = useRevokeTeamInvite();

  const [teamName, setTeamName] = useState("");

  // Initialize form when team loads
  useEffect(() => {
    if (team) {
      setTeamName(team.name);
    }
  }, [team]);

  const canManage = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  if (!user) {
    navigate("/auth?redirect=/team/" + teamId + "/settings");
    return null;
  }

  if (teamLoading || membersLoading) {
    return (
      <main className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="container max-w-4xl py-8">
        <p className="text-muted-foreground">Team not found or you don't have access.</p>
      </main>
    );
  }

  if (!canManage) {
    return (
      <main className="container max-w-4xl py-8">
        <p className="text-muted-foreground">You don't have permission to manage this team.</p>
      </main>
    );
  }

  const handleSaveSettings = async () => {
    try {
      await updateTeam.mutateAsync({
        teamId: team.id,
        updates: {
          name: teamName || team.name,
        },
      });
      toast.success("Team settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleCreateInvite = async () => {
    if (!user || !team) return;
    try {
      const invite = await createInvite.mutateAsync({ teamId: team.id, userId: user.id });
      await navigator.clipboard.writeText(inviteUrl(invite.token)).catch(() => {});
      toast.success("Invite link created and copied to clipboard");
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Failed to create invite link");
    }
  };

  const handleCopyInvite = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast.success("Invite link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!team) return;
    try {
      await revokeInvite.mutateAsync({ inviteId, teamId: team.id });
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam.mutateAsync(team.id);
      toast.success("Team deleted");
      navigate("/library");
    } catch (error) {
      toast.error("Failed to delete team");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: "admin" | "member") => {
    try {
      await updateMemberRole.mutateAsync({ memberId, role: newRole });
      toast.success("Role updated");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember.mutateAsync(memberId);
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <main className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Team Settings</h1>
        <Link to={`/team/${teamId}/activity`}>
          <Button variant="outline" className="gap-2">
            <Activity className="h-4 w-4" />
            View Activity
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Basic settings for your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveSettings} disabled={updateTeam.isPending}>
              {updateTeam.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to this team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.profile?.display_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.profile?.display_name || "Unknown User"}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role}
                    </p>
                  </div>
                </div>

                {member.role !== "owner" && isOwner && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.id, value as "admin" | "member")
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                <UserPlus className="h-4 w-4 inline mr-2" />
                Invite members with a link
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateInvite}
                  disabled={createInvite.isPending}
                  className="gap-2"
                >
                  {createInvite.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  Create invite link
                </Button>
              </div>

              {invites.length > 0 && (
                <div className="space-y-2">
                  {invites.map((invite) => {
                    const expired = new Date(invite.expires_at) < new Date();
                    return (
                      <div
                        key={invite.id}
                        className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
                      >
                        <code className="min-w-0 flex-1 truncate bg-muted px-2 py-1 rounded text-xs">
                          {inviteUrl(invite.token)}
                        </code>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {expired
                            ? "Expired"
                            : `Expires ${format(new Date(invite.expires_at), "MMM d")}`}
                          {invite.used_count > 0 && ` · ${invite.used_count} joined`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleCopyInvite(invite.token)}
                          aria-label="Copy invite link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleRevokeInvite(invite.id)}
                          aria-label="Revoke invite"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Anyone with a link can join as a member until it expires (14 days) or is revoked.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Sync — configured centrally in Settings to avoid a second,
            token-less copy of the same form drifting out of sync. */}
        <Card>
          <CardHeader>
            <CardTitle>GitHub Sync</CardTitle>
            <CardDescription>
              Sync team artifacts to a shared GitHub repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.github_repo ? (
              <p className="text-sm text-muted-foreground">
                Syncing to <strong>{team.github_repo}</strong> ({team.github_branch || "main"}
                {team.github_folder ? `, /${team.github_folder}` : ""}).
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No repository configured yet.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Configure the repository, access token, and test the connection in
              Settings while this team's workspace is active. Trigger syncs from
              the Library's "Sync to GitHub" button.
            </p>
            <Link to="/settings">
              <Button variant="outline" size="sm">Open GitHub Sync Settings</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <p>
                          This will permanently delete the team{" "}
                          <span className="font-medium text-foreground">"{team.name}"</span>. This action cannot be undone.
                        </p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          <li>All members will be removed from the team</li>
                          <li>Pending invitations and join requests will be cancelled</li>
                          <li>Team activity feed and shared pins will be deleted</li>
                          <li>
                            Artifacts created in this team workspace will remain in their authors' personal libraries,
                            but will no longer be shared with other team members
                          </li>
                        </ul>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteTeam}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
