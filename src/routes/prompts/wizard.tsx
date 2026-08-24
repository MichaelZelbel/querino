import { createFileRoute } from "@tanstack/react-router";
import PromptWizard from "@/pages/PromptWizard";

export const Route = createFileRoute("/prompts/wizard")({
  component: PromptWizard,
});
