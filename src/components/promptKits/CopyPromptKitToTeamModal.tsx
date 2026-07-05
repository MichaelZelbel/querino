import { useCopyPromptKitToTeam } from "@/hooks/useCopyPromptKitToTeam";
import { CopyArtifactToTeamModal } from "@/components/shared/CopyArtifactToTeamModal";

interface CopyPromptKitToTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptKit: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    category: string | null;
    tags?: string[] | null;
  };
}

export function CopyPromptKitToTeamModal({ open, onOpenChange, promptKit }: CopyPromptKitToTeamModalProps) {
  const { copyKitToTeam, copying } = useCopyPromptKitToTeam();

  return (
    <CopyArtifactToTeamModal
      open={open}
      onOpenChange={onOpenChange}
      source={promptKit}
      label="prompt kit"
      detailPathPrefix="/prompt-kits"
      copyToTeam={copyKitToTeam}
      copying={copying}
    />
  );
}
