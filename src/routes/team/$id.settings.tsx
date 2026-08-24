import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import TeamSettings from "@/pages/TeamSettings";

export const Route = createFileRoute("/team/$id/settings")({
  head: () => privateHead("Team Settings"),
  component: TeamSettings,
});
