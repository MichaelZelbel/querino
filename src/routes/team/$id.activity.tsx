import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import TeamActivity from "@/pages/TeamActivity";

export const Route = createFileRoute("/team/$id/activity")({
  head: () => privateHead("Team Activity"),
  component: TeamActivity,
});
