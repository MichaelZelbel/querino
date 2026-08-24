import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import PromptEdit from "@/pages/LibraryPromptEdit";

export const Route = createFileRoute("/library/$slug/edit")({
  head: () => privateHead("Edit Prompt"),
  component: PromptEdit,
});
