import { createFileRoute } from "@tanstack/react-router";
import TeamJoin from "@/pages/TeamJoin";

export const Route = createFileRoute("/team/join")({
  component: TeamJoin,
});
