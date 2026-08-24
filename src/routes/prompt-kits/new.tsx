import { createFileRoute } from "@tanstack/react-router";
import PromptKitNew from "@/pages/PromptKitNew";

export const Route = createFileRoute("/prompt-kits/new")({
  component: PromptKitNew,
});
