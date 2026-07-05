import { createReviewsHook } from "./useArtifactReviews";

export const useSkillReviews = createReviewsHook({
  table: "skill_reviews",
  idColumn: "skill_id",
});
