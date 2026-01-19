import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJoinTeam } from "@/hooks/useJoinTeam";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNavigate } from "react-router-dom";
import { Loader2, Users, ExternalLink } from "lucide-react";

interface JoinTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinTeamModal({ open, onOpenChange }: JoinTeamModalProps) {
  const [teamId, setTeamId] = useState("");
  const [joinedTeam, setJoinedTeam] = useState<{ teamId: string; teamName: string } | null>(null);
  const { joinTeam, isJoining } = useJoinTeam();
  const { user } = useAuthContext();
  const { switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!user || !teamId.trim()) return;
    
    const result = await joinTeam(teamId.trim(), user.id);
    if (result) {
      setJoinedTeam(result);
    }
  };

  const handleOpenTeam = () => {
    if (joinedTeam) {
      switchWorkspace(joinedTeam.teamId);
      navigate("/library");
      onOpenChange(false);
      resetState();
    }
  };

  const resetState = () => {
    setTeamId("");
    setJoinedTeam(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  // Success state
  if (joinedTeam) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Joined successfully!
            </DialogTitle>
            <DialogDescription>
              You're now a member of <strong>{joinedTeam.teamName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
            <Button onClick={handleOpenTeam} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open team workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a team</DialogTitle>
          <DialogDescription>
            Enter the team ID shared with you to join the team workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="team-id">Team ID</Label>
            <Input
              id="team-id"
              placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={isJoining}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Ask the team owner or admin for the team ID. You must have a Premium account to join teams.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isJoining}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isJoining || !teamId.trim()}>
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join team"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
