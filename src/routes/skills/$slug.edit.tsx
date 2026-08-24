import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import SkillEdit from "@/pages/SkillEdit";

export const Route = createFileRoute("/skills/$slug/edit")({
  head: () => privateHead("Edit Skill"),
  component: SkillEdit,
});
