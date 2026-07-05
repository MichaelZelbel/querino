import { createCopyToTeamHook } from "./useCopyArtifactToTeam";

interface SourceSkill {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  category?: string | null;
  tags?: string[] | null;
}

const useBase = createCopyToTeamHook<SourceSkill>({
  table: "skills",
  label: "skill",
  buildInsert: (source, includeMetadata) => ({
    title: source.title,
    content: source.content,
    published: false,
    rating_avg: 0,
    rating_count: 0,
    description: includeMetadata ? source.description || null : null,
    category: includeMetadata ? source.category || null : null,
    tags: includeMetadata ? source.tags || [] : [],
  }),
});

export function useCopySkillToTeam() {
  const { copyToTeam, copying } = useBase();
  return { copySkillToTeam: copyToTeam, copying };
}
