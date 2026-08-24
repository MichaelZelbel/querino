import { createFileRoute } from "@tanstack/react-router";
import PromptDetail from "@/pages/PromptDetail";

export const Route = createFileRoute("/prompts/$slug/")({
  component: PromptDetail,
});
