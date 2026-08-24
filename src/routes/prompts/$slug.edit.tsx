import { createFileRoute } from "@tanstack/react-router";
import PromptEdit from "@/pages/LibraryPromptEdit";

export const Route = createFileRoute("/prompts/$slug/edit")({
  component: PromptEdit,
});
