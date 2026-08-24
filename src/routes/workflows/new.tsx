import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import WorkflowNew from "@/pages/WorkflowNew";

export const Route = createFileRoute("/workflows/new")({
  head: () => privateHead("New Workflow"),
  component: WorkflowNew,
});
