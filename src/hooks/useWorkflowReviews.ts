import { createReviewsHook } from "./useArtifactReviews";

export const useWorkflowReviews = createReviewsHook({
  table: "workflow_reviews",
  idColumn: "workflow_id",
});
