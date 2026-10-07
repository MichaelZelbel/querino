import type { Workflow } from "@/types/workflow";
import { createCloneHook } from "./useCloneArtifact";

// `scope` is a column the shared Workflow type does not declare yet; the
// detail page's row (the route loader's) carries it.
const useBase = createCloneHook<Workflow & { scope?: string | null }>({
  table: "workflows",
  label: "workflow",
  // Workflows are markdown in `content`; `json` is the legacy shape and is
  // NOT NULL in the database, so it is copied when present and otherwise
  // written as an empty object. The file name and scope are copied the way
  // Duplicate and Copy to team copy them; a clone used to lose both and fall
  // back to the defaults (2026-10-07).
  buildInsert: (workflow) => ({
    description: workflow.description,
    content: workflow.content,
    json: workflow.json ?? {},
    category: workflow.category,
    tags: workflow.tags,
    ...(workflow.language ? { language: workflow.language } : {}),
    filename: workflow.filename || null,
    ...(workflow.scope ? { scope: workflow.scope } : {}),
    published: false,
  }),
  // WorkflowEdit looks the workflow up by slug, never by id.
  editPath: (row) => `/workflows/${row.slug}/edit`,
});

export function useCloneWorkflow() {
  const { clone, cloning } = useBase();
  return { cloneWorkflow: clone, cloning };
}
