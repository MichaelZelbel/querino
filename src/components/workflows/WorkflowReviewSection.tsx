import { useWorkflowReviews } from "@/hooks/useWorkflowReviews";
import { ReviewSection as GenericReviewSection } from "@/components/reviews/ReviewSection";

interface WorkflowReviewSectionProps {
  workflowId: string;
  workflowSlug?: string;
  userId?: string;
  ratingAvg: number;
  ratingCount: number;
  /** Private items take no reviews; see reviewSummary.ratingMode. */
  isPublic?: boolean | null;
}

/**
 * Workflow-specific ReviewSection wrapper that uses useWorkflowReviews hook
 */
export function WorkflowReviewSection({
  workflowId,
  workflowSlug,
  userId,
  ratingAvg,
  ratingCount,
  isPublic,
}: WorkflowReviewSectionProps) {
  const {
    reviews,
    userReview,
    loading,
    submitting,
    submitReview,
    deleteReview,
  } = useWorkflowReviews(workflowId, userId);

  return (
    <GenericReviewSection
      itemId={workflowId}
      itemType="workflow"
      itemSlug={workflowSlug}
      userId={userId}
      ratingAvg={ratingAvg}
      ratingCount={ratingCount}
      isPublic={isPublic}
      reviews={reviews}
      userReview={userReview}
      loading={loading}
      submitting={submitting}
      onSubmitReview={submitReview}
      onDeleteReview={deleteReview}
    />
  );
}
