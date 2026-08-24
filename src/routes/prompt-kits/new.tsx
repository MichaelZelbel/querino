import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import PromptKitNew from "@/pages/PromptKitNew";

export const Route = createFileRoute("/prompt-kits/new")({
  head: () => privateHead("New Prompt Kit"),
  component: PromptKitNew,
});
