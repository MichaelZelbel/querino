import { createFileRoute } from "@tanstack/react-router";
import SkillNew from "@/pages/SkillNew";

export const Route = createFileRoute("/skills/new")({
  component: SkillNew,
});
