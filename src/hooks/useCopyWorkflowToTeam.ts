import { createCopyToTeamHook } from "./useCopyArtifactToTeam";

interface SourceWorkflow {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  json?: unknown;
  category?: string | null;
  tags?: string[] | null;
  filename?: string | null;
  scope?: string | null;
}

const useBase = createCopyToTeamHook<SourceWorkflow>({
  table: "workflows",
  label: "workflow",
  buildInsert: (source, includeMetadata) => ({
    title: source.title,
    content: source.content || null,
    json: source.json || {},
    published: false,
    rating_avg: 0,
    rating_count: 0,
    description: includeMetadata ? source.description || null : null,
    category: includeMetadata ? source.category || null : null,
    tags: includeMetadata ? source.tags || [] : [],
    filename: includeMetadata ? source.filename || null : null,
    scope: includeMetadata ? source.scope || "workspace" : "workspace",
  }),
});

export function useCopyWorkflowToTeam() {
  const { copyToTeam, copying } = useBase();
  return { copyWorkflowToTeam: copyToTeam, copying };
}
