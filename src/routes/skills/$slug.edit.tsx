import { createFileRoute } from "@tanstack/react-router";
import SkillEdit from "@/pages/SkillEdit";

export const Route = createFileRoute("/skills/$slug/edit")({
  component: SkillEdit,
});
