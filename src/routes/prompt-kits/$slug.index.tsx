import { createFileRoute } from "@tanstack/react-router";
import PromptKitDetail from "@/pages/PromptKitDetail";

export const Route = createFileRoute("/prompt-kits/$slug/")({
  component: PromptKitDetail,
});
