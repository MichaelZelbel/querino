import { usePromptKitReviews } from "@/hooks/usePromptKitReviews";
import { ReviewSection as GenericReviewSection } from "@/components/reviews/ReviewSection";

interface PromptKitReviewSectionProps {
  kitId: string;
  kitSlug?: string;
  userId?: string;
  ratingAvg: number;
  ratingCount: number;
  /** Private items take no reviews; see reviewSummary.ratingMode. */
  isPublic?: boolean | null;
}

export function PromptKitReviewSection({
  kitId,
  kitSlug,
  userId,
  ratingAvg,
  ratingCount,
  isPublic,
}: PromptKitReviewSectionProps) {
  const {
    reviews,
    userReview,
    loading,
    submitting,
    submitReview,
    deleteReview,
  } = usePromptKitReviews(kitId, userId);

  return (
    <GenericReviewSection
      itemId={kitId}
      itemType="prompt_kit"
      itemSlug={kitSlug}
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
