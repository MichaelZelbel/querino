import type { Workflow, WorkflowAuthor } from "@/types/workflow";
import { createArtifactListHook, type ArtifactListOptions } from "./useArtifactList";

export type UseWorkflowsOptions = ArtifactListOptions;

export const useWorkflows = createArtifactListHook<Workflow & { author?: WorkflowAuthor | null }>({
  table: "workflows",
  queryKey: "workflows",
  semanticType: "workflow",
});
