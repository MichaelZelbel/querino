import { usePromptReviews } from "@/hooks/usePromptReviews";
import { ReviewSection as GenericReviewSection } from "@/components/reviews/ReviewSection";

interface ReviewSectionProps {
  promptId: string;
  userId?: string;
  ratingAvg: number;
  ratingCount: number;
}

/**
 * Prompt-specific ReviewSection wrapper that uses usePromptReviews hook
 */
export function ReviewSection({
  promptId,
  userId,
  ratingAvg,
  ratingCount,
}: ReviewSectionProps) {
  const {
    reviews,
    userReview,
    loading,
    submitting,
    submitReview,
    deleteReview,
  } = usePromptReviews(promptId, userId);

  return (
    <GenericReviewSection
      itemId={promptId}
      itemType="prompt"
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
