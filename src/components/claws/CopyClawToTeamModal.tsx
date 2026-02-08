import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserTeams } from "@/hooks/useTeams";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Claw } from "@/types/claw";

interface CopyClawToTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claw: Claw;
}

export function CopyClawToTeamModal({
  open,
  onOpenChange,
  claw,
}: CopyClawToTeamModalProps) {
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    setCopying(true);
    try {
      const { error } = await (supabase
        .from("claws") as any)
        .insert({
          title: claw.title,
          description: claw.description,
          content: claw.content,
          category: claw.category,
          tags: claw.tags,
          source: claw.source,
          team_id: selectedTeamId,
          published: false,
          skill_source_type: claw.skill_source_type,
          skill_source_ref: claw.skill_source_ref,
          skill_source_path: claw.skill_source_path,
          skill_source_version: claw.skill_source_version,
          skill_md_content: claw.skill_md_content,
          skill_md_cached: claw.skill_md_cached,
        });

      if (error) throw error;

      toast.success("Claw copied to team!");
      onOpenChange(false);
    } catch (err) {
      console.error("Error copying claw to team:", err);
      toast.error("Failed to copy claw to team");
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy Claw to Team</DialogTitle>
          <DialogDescription>
            Select a team to copy "{claw.title}" to.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {teamsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              You're not a member of any teams yet.
            </p>
          ) : (
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!selectedTeamId || copying || teams.length === 0}
          >
            {copying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Copy to Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
