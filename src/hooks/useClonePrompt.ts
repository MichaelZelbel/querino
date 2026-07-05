import { createCloneHook } from "./useCloneArtifact";

interface SourcePrompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags?: string[] | null;
}

const useBase = createCloneHook<SourcePrompt>({
  table: "prompts",
  label: "prompt",
  buildInsert: (source) => ({
    description: source.description,
    content: source.content,
    category: source.category,
    tags: source.tags || [],
    is_public: false,
    rating_avg: 0,
    rating_count: 0,
    copies_count: 0,
  }),
  editPath: (row) => `/library/${row.slug}/edit`,
});

export function useClonePrompt() {
  const { clone, cloning } = useBase();
  return { clonePrompt: clone, cloning };
}
