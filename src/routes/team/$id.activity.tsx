import { createFileRoute } from "@tanstack/react-router";
import TeamActivity from "@/pages/TeamActivity";

export const Route = createFileRoute("/team/$id/activity")({
  component: TeamActivity,
});
