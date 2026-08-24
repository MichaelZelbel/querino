import { createFileRoute } from "@tanstack/react-router";
import WorkflowEdit from "@/pages/WorkflowEdit";

export const Route = createFileRoute("/workflows/$slug/edit")({
  component: WorkflowEdit,
});
