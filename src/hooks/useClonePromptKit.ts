import { createCloneHook } from "./useCloneArtifact";

interface SourcePromptKit {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string | null;
  tags?: string[] | null;
}

const useBase = createCloneHook<SourcePromptKit>({
  table: "prompt_kits",
  label: "prompt kit",
  buildInsert: (source) => ({
    description: source.description,
    content: source.content,
    category: source.category,
    tags: source.tags || [],
    published: false,
  }),
  editPath: (row) => `/prompt-kits/${row.slug}/edit`,
});

export function useClonePromptKit() {
  const { clone, cloning } = useBase();
  return { cloneKit: clone, cloning };
}
