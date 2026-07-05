import { useCopyPromptToTeam } from "@/hooks/useCopyPromptToTeam";
import { CopyArtifactToTeamModal } from "@/components/shared/CopyArtifactToTeamModal";

interface CopyToTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: {
    id: string;
    title: string;
    description: string;
    content: string;
    category: string;
    tags?: string[] | null;
  };
}

export function CopyToTeamModal({ open, onOpenChange, prompt }: CopyToTeamModalProps) {
  const { copyPromptToTeam, copying } = useCopyPromptToTeam();

  return (
    <CopyArtifactToTeamModal
      open={open}
      onOpenChange={onOpenChange}
      source={prompt}
      label="prompt"
      detailPathPrefix="/prompts"
      copyToTeam={copyPromptToTeam}
      copying={copying}
    />
  );
}
