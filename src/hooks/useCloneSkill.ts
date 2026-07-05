import type { Skill } from "@/types/skill";
import { createCloneHook } from "./useCloneArtifact";

const useBase = createCloneHook<Skill>({
  table: "skills",
  label: "skill",
  buildInsert: (skill) => ({
    description: skill.description,
    content: skill.content,
    tags: skill.tags,
    published: false,
  }),
  editPath: (row) => `/skills/${row.slug}/edit`,
});

export function useCloneSkill() {
  const { clone, cloning } = useBase();
  return { cloneSkill: clone, cloning };
}
