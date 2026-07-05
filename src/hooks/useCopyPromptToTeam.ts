import { createCopyToTeamHook } from "./useCopyArtifactToTeam";

interface SourcePrompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags?: string[] | null;
}

const useBase = createCopyToTeamHook<SourcePrompt>({
  table: "prompts",
  label: "prompt",
  buildInsert: (source, includeMetadata) => ({
    title: source.title,
    content: source.content,
    is_public: false,
    rating_avg: 0,
    rating_count: 0,
    copies_count: 0,
    description: includeMetadata ? source.description : "",
    category: includeMetadata ? source.category : "writing",
    tags: includeMetadata ? source.tags || [] : [],
  }),
});

export function useCopyPromptToTeam() {
  const { copyToTeam, copying } = useBase();
  return { copyPromptToTeam: copyToTeam, copying };
}
