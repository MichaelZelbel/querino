import { createFileRoute } from "@tanstack/react-router";
import PromptKitEdit from "@/pages/PromptKitEdit";

export const Route = createFileRoute("/prompt-kits/$slug/edit")({
  component: PromptKitEdit,
});
