import { createFileRoute } from "@tanstack/react-router";
import PromptEdit from "@/pages/LibraryPromptEdit";

export const Route = createFileRoute("/library/$slug/edit")({
  component: PromptEdit,
});
