import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import PromptKitEdit from "@/pages/PromptKitEdit";

export const Route = createFileRoute("/prompt-kits/$slug/edit")({
  head: () => privateHead("Edit Prompt Kit"),
  component: PromptKitEdit,
});
