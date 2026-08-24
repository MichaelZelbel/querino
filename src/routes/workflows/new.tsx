import { createFileRoute } from "@tanstack/react-router";
import WorkflowNew from "@/pages/WorkflowNew";

export const Route = createFileRoute("/workflows/new")({
  component: WorkflowNew,
});
