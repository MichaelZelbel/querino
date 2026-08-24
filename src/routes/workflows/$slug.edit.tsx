import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import WorkflowEdit from "@/pages/WorkflowEdit";

export const Route = createFileRoute("/workflows/$slug/edit")({
  head: () => privateHead("Edit Workflow"),
  component: WorkflowEdit,
});
