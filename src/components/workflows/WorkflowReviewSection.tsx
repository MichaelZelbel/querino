import { useWorkflowReviews } from "@/hooks/useWorkflowReviews";
import { ReviewSection as GenericReviewSection } from "@/components/reviews/ReviewSection";

interface WorkflowReviewSectionProps {
  workflowId: string;
  workflowSlug?: string;
  userId?: string;
  ratingAvg: number;
  ratingCount: number;
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
}: WorkflowReviewSectionProps) {
  const { reviews, userReview, loading, submitting, submitReview, deleteReview } =
    useWorkflowReviews(workflowId, userId);

  return (
    <GenericReviewSection
      itemId={workflowId}
      itemType="workflow"
      itemSlug={workflowSlug}
      userId={userId}
      ratingAvg={ratingAvg}
      ratingCount={ratingCount}
      reviews={reviews}
      userReview={userReview}
      loading={loading}
      submitting={submitting}
      onSubmitReview={submitReview}
      onDeleteReview={deleteReview}
    />
  );
}
