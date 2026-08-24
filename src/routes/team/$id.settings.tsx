import { createFileRoute } from "@tanstack/react-router";
import TeamSettings from "@/pages/TeamSettings";

export const Route = createFileRoute("/team/$id/settings")({
  component: TeamSettings,
});
