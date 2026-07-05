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
import { redeemTeamInvite } from "@/hooks/useTeamInvites";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Users, ExternalLink } from "lucide-react";

interface JoinTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Accepts a full invite URL or a bare token. */
function extractToken(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("token") || trimmed;
  } catch {
    return trimmed;
  }
}

export function JoinTeamModal({ open, onOpenChange }: JoinTeamModalProps) {
  const [inviteInput, setInviteInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinedTeam, setJoinedTeam] = useState<{ teamId: string; teamName: string } | null>(null);
  const { user } = useAuthContext();
  const { switchWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleJoin = async () => {
    if (!user || !inviteInput.trim()) return;

    setIsJoining(true);
    try {
      const result = await redeemTeamInvite(extractToken(inviteInput));
      await queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      setJoinedTeam({ teamId: result.team_id, teamName: result.team_name });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join team";
      toast.error(
        message.includes("expired")
          ? "This invite has expired. Ask a team admin for a new one."
          : message.includes("not found")
            ? "This invite is invalid or has been revoked."
            : message
      );
    } finally {
      setIsJoining(false);
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
    setInviteInput("");
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
            Paste the invite link (or token) a team admin shared with you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-link">Invite link</Label>
            <Input
              id="invite-link"
              placeholder="https://querino.ai/team/join?token=…"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              disabled={isJoining}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Team owners and admins can create invite links in Team Settings.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isJoining}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isJoining || !inviteInput.trim()}>
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
