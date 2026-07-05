import { useCopyWorkflowToTeam } from "@/hooks/useCopyWorkflowToTeam";
import { CopyArtifactToTeamModal } from "@/components/shared/CopyArtifactToTeamModal";

interface CopyWorkflowToTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: {
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    json?: unknown;
    category?: string | null;
    tags?: string[] | null;
    filename?: string | null;
    scope?: string | null;
  };
}

export function CopyWorkflowToTeamModal({ open, onOpenChange, workflow }: CopyWorkflowToTeamModalProps) {
  const { copyWorkflowToTeam, copying } = useCopyWorkflowToTeam();

  return (
    <CopyArtifactToTeamModal
      open={open}
      onOpenChange={onOpenChange}
      source={workflow}
      label="workflow"
      detailPathPrefix="/workflows"
      copyToTeam={copyWorkflowToTeam}
      copying={copying}
    />
  );
}
