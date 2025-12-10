import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, UserPlus, Crown, Shield, User as UserIcon } from "lucide-react";
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

  const [teamName, setTeamName] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubFolder, setGithubFolder] = useState("");

  // Initialize form when team loads
  useState(() => {
    if (team) {
      setTeamName(team.name);
      setGithubRepo(team.github_repo || "");
      setGithubBranch(team.github_branch || "main");
      setGithubFolder(team.github_folder || "");
    }
  });

  const canManage = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  if (!user) {
    navigate("/auth?redirect=/team/" + teamId + "/settings");
    return null;
  }

  if (teamLoading || membersLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-muted-foreground">Team not found or you don't have access.</p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-muted-foreground">You don't have permission to manage this team.</p>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    try {
      await updateTeam.mutateAsync({
        teamId: team.id,
        updates: {
          name: teamName || team.name,
          github_repo: githubRepo || null,
          github_branch: githubBranch || "main",
          github_folder: githubFolder || null,
        },
      });
      toast.success("Team settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
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
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-8">Team Settings</h1>

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
                value={teamName || team.name}
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
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4 inline mr-2" />
                To invite members, share your team ID with them:
              </p>
              <code className="block p-2 bg-muted rounded text-sm break-all">
                {team.id}
              </code>
              <p className="text-xs text-muted-foreground">
                Note: Email invites require additional setup. For now, share this ID.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Sync */}
        <Card>
          <CardHeader>
            <CardTitle>GitHub Sync</CardTitle>
            <CardDescription>
              Sync team artifacts to a shared GitHub repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-repo">Repository (owner/repo)</Label>
              <Input
                id="github-repo"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="myorg/prompts"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github-branch">Branch</Label>
                <Input
                  id="github-branch"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  placeholder="main"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-folder">Folder Path</Label>
                <Input
                  id="github-folder"
                  value={githubFolder}
                  onChange={(e) => setGithubFolder(e.target.value)}
                  placeholder="prompts/"
                />
              </div>
            </div>
            <Button onClick={handleSaveSettings} disabled={updateTeam.isPending}>
              {updateTeam.isPending ? "Saving..." : "Save GitHub Settings"}
            </Button>
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
                    <AlertDialogDescription>
                      This will permanently delete the team "{team.name}" and remove
                      all members. Team artifacts will remain but will no longer be
                      associated with this team.
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
    </div>
  );
}
