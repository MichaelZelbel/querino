import { createFileRoute } from "@tanstack/react-router";
import PromptNew from "@/pages/PromptNew";

export const Route = createFileRoute("/prompts/new")({
  component: PromptNew,
});
