import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Plus, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreateTeam } from "@/hooks/useTeams";
import { toast } from "sonner";

export function WorkspacePicker() {
  const navigate = useNavigate();
  const { currentWorkspace, currentTeam, teams, switchWorkspace, canManageTeam } = useWorkspace();
  const createTeam = useCreateTeam();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const team = await createTeam.mutateAsync(newTeamName.trim());
      switchWorkspace(team.id);
      setShowCreateDialog(false);
      setNewTeamName("");
      toast.success("Team created successfully!");
    } catch (error) {
      toast.error("Failed to create team");
    }
  };

  const displayName = currentWorkspace === "personal" 
    ? "Personal" 
    : currentTeam?.name || "Team";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-3">
            {currentWorkspace === "personal" ? (
              <User className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="max-w-[120px] truncate">{displayName}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={() => switchWorkspace("personal")}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            Personal Workspace
            {currentWorkspace === "personal" && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>

          {teams.length > 0 && <DropdownMenuSeparator />}

          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => switchWorkspace(team.id)}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              <span className="flex-1 truncate">{team.name}</span>
              {currentWorkspace === team.id && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {currentWorkspace !== "personal" && canManageTeam && (
            <DropdownMenuItem
              onClick={() => navigate(`/team/${currentWorkspace}/settings`)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Team Settings
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="My Awesome Team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim() || createTeam.isPending}
            >
              {createTeam.isPending ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
