import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import Settings from "@/pages/Settings";

export const Route = createFileRoute("/settings")({
  head: () => privateHead("Settings"),
  component: Settings,
});
