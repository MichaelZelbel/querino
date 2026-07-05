import { useCopySkillToTeam } from "@/hooks/useCopySkillToTeam";
import { CopyArtifactToTeamModal } from "@/components/shared/CopyArtifactToTeamModal";

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
  const { copySkillToTeam, copying } = useCopySkillToTeam();

  return (
    <CopyArtifactToTeamModal
      open={open}
      onOpenChange={onOpenChange}
      source={skill}
      label="skill"
      detailPathPrefix="/skills"
      copyToTeam={copySkillToTeam}
      copying={copying}
    />
  );
}
