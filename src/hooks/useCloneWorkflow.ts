import type { Workflow } from "@/types/workflow";
import { createCloneHook } from "./useCloneArtifact";

const useBase = createCloneHook<Workflow>({
  table: "workflows",
  label: "workflow",
  // Workflows are markdown in `content`; `json` is the legacy shape and is
  // NOT NULL in the database, so it is copied when present and otherwise
  // written as an empty object.
  buildInsert: (workflow) => ({
    description: workflow.description,
    content: workflow.content,
    json: workflow.json ?? {},
    category: workflow.category,
    tags: workflow.tags,
    ...(workflow.language ? { language: workflow.language } : {}),
    published: false,
  }),
  // WorkflowEdit looks the workflow up by slug, never by id.
  editPath: (row) => `/workflows/${row.slug}/edit`,
});

export function useCloneWorkflow() {
  const { clone, cloning } = useBase();
  return { cloneWorkflow: clone, cloning };
}
