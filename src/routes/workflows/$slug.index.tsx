import { createFileRoute } from "@tanstack/react-router";
import WorkflowDetail from "@/pages/WorkflowDetail";

export const Route = createFileRoute("/workflows/$slug/")({
  component: WorkflowDetail,
});
