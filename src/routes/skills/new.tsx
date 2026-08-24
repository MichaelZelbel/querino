import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import SkillNew from "@/pages/SkillNew";

export const Route = createFileRoute("/skills/new")({
  head: () => privateHead("New Skill"),
  component: SkillNew,
});
