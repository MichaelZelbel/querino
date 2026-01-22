import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCopySkillToTeam } from "@/hooks/useCopySkillToTeam";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Users, Info, ExternalLink } from "lucide-react";

interface CopySkillToTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: {
    id: string;
    title: string;
    description?: string | null;
    content: string;
    category?: string | null;
    tags?: string[] | null;
  };
}

export function CopySkillToTeamModal({ open, onOpenChange, skill }: CopySkillToTeamModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { teams, switchWorkspace } = useWorkspace();
  const { copySkillToTeam, copying } = useCopySkillToTeam();
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || "");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [copiedResult, setCopiedResult] = useState<{ slug: string; teamName: string; teamId: string } | null>(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const handleCopy = async () => {
    if (!user || !selectedTeamId || !selectedTeam) return;

    const result = await copySkillToTeam(
      skill,
      selectedTeamId,
      selectedTeam.name,
      user.id,
      { includeMetadata }
    );

    if (result) {
      setCopiedResult({
        slug: result.slug,
        teamName: result.teamName,
        teamId: selectedTeamId,
      });
      toast.success(`Copied to ${result.teamName}`);
    }
  };

  const handleOpenInTeam = () => {
    if (!copiedResult) return;
    
    // Switch workspace and navigate
    switchWorkspace(copiedResult.teamId);
    navigate(`/skills/${copiedResult.slug}`);
    onOpenChange(false);
    setCopiedResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCopiedResult(null);
  };

  // If copy was successful, show success state
  if (copiedResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Copied Successfully
            </DialogTitle>
            <DialogDescription>
              Your skill has been copied to <strong>{copiedResult.teamName}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleClose}>
              Done
            </Button>
            <Button onClick={handleOpenInTeam} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open in team workspace
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
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Copy to team
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{skill.title}" in a team workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team selector */}
          <div className="space-y-2">
            <Label htmlFor="team-select">Team</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger id="team-select">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Include metadata checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-metadata"
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
            />
            <Label htmlFor="include-metadata" className="text-sm font-normal">
              Include current tags, category, and description
            </Label>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This creates a copy. Future edits won't sync automatically between the original and the team copy.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={copying || !selectedTeamId}
          >
            {copying ? "Copying..." : "Create team copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
