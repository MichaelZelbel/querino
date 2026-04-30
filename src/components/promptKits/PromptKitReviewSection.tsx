import { usePromptKitReviews } from "@/hooks/usePromptKitReviews";
import { ReviewSection as GenericReviewSection } from "@/components/reviews/ReviewSection";

interface PromptKitReviewSectionProps {
  kitId: string;
  kitSlug?: string;
  userId?: string;
  ratingAvg: number;
  ratingCount: number;
}

export function PromptKitReviewSection({
  kitId,
  kitSlug,
  userId,
  ratingAvg,
  ratingCount,
}: PromptKitReviewSectionProps) {
  const { reviews, userReview, loading, submitting, submitReview, deleteReview } =
    usePromptKitReviews(kitId, userId);

  return (
    <GenericReviewSection
      itemId={kitId}
      itemType="prompt_kit"
      itemSlug={kitSlug}
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
