import { createCopyToTeamHook } from "./useCopyArtifactToTeam";

interface SourcePromptKit {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string | null;
  tags?: string[] | null;
}

const useBase = createCopyToTeamHook<SourcePromptKit>({
  table: "prompt_kits",
  label: "prompt kit",
  buildInsert: (source, includeMetadata) => ({
    title: source.title,
    content: source.content,
    published: false,
    ...(includeMetadata
      ? { description: source.description, category: source.category, tags: source.tags || [] }
      : { description: "", tags: [] }),
  }),
});

export function useCopyPromptKitToTeam() {
  const { copyToTeam, copying } = useBase();
  return { copyKitToTeam: copyToTeam, copying };
}
