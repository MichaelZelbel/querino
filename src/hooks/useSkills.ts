import type { Skill, SkillAuthor } from "@/types/skill";
import { createArtifactListHook, type ArtifactListOptions } from "./useArtifactList";

export type UseSkillsOptions = ArtifactListOptions;

export const useSkills = createArtifactListHook<Skill & { author?: SkillAuthor | null }>({
  table: "skills",
  queryKey: "skills",
  semanticType: "skill",
});
