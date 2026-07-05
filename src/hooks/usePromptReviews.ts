import { createReviewsHook } from "./useArtifactReviews";

export const usePromptReviews = createReviewsHook({
  table: "prompt_reviews",
  idColumn: "prompt_id",
});
