import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import TeamJoin from "@/pages/TeamJoin";

export const Route = createFileRoute("/team/join")({
  head: () => privateHead("Join Team"),
  component: TeamJoin,
});
