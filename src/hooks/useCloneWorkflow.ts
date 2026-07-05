import type { Workflow } from "@/types/workflow";
import { createCloneHook } from "./useCloneArtifact";

const useBase = createCloneHook<Workflow>({
  table: "workflows",
  label: "workflow",
  buildInsert: (workflow) => ({
    description: workflow.description,
    json: workflow.json,
    tags: workflow.tags,
    published: false,
  }),
  editPath: (row) => `/workflows/${row.id}/edit`,
});

export function useCloneWorkflow() {
  const { clone, cloning } = useBase();
  return { cloneWorkflow: clone, cloning };
}
