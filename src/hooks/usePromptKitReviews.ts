import { createReviewsHook } from "./useArtifactReviews";

export const usePromptKitReviews = createReviewsHook({
  table: "prompt_kit_reviews",
  idColumn: "prompt_kit_id",
});
