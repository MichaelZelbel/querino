import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import PromptWizard from "@/pages/PromptWizard";

export const Route = createFileRoute("/prompts/wizard")({
  head: () => privateHead("Prompt Wizard"),
  component: PromptWizard,
});
