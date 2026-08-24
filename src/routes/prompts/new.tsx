import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import PromptNew from "@/pages/PromptNew";

export const Route = createFileRoute("/prompts/new")({
  head: () => privateHead("New Prompt"),
  component: PromptNew,
});
