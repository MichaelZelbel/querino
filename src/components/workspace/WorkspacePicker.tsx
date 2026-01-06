import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Plus, User, Settings, Check } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreateTeam } from "@/hooks/useTeams";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WorkspacePicker() {
  const navigate = useNavigate();
  const { currentWorkspace, currentTeam, teams, switchWorkspace, canManageTeam, isTeamWorkspace } = useWorkspace();
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
          <Button 
            variant="outline" 
            className={cn(
              "gap-2 px-3 h-9 border-dashed",
              isTeamWorkspace && "border-primary/50 bg-primary/5"
            )}
          >
            {currentWorkspace === "personal" ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Building2 className="h-4 w-4 text-primary" />
            )}
            <span className="max-w-[140px] truncate font-medium">{displayName}</span>
            {isTeamWorkspace && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-0">
                Team
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Switch Workspace
          </div>
          <DropdownMenuItem
            onClick={() => switchWorkspace("personal")}
            className="gap-2 py-2.5"
          >
            <User className="h-4 w-4" />
            <div className="flex-1">
              <p className="font-medium">Personal Workspace</p>
              <p className="text-xs text-muted-foreground">Your private prompts & settings</p>
            </div>
            {currentWorkspace === "personal" && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>

          {teams.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Teams
              </div>
            </>
          )}

          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => switchWorkspace(team.id)}
              className="gap-2 py-2.5"
            >
              <Building2 className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{team.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{team.role}</p>
              </div>
              {currentWorkspace === team.id && (
                <Check className="h-4 w-4 text-primary" />
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
