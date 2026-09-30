import { useSkillReviews } from "@/hooks/useSkillReviews";
import { ReviewSection as GenericReviewSection } from "@/components/reviews/ReviewSection";

interface SkillReviewSectionProps {
  skillId: string;
  skillSlug?: string;
  userId?: string;
  ratingAvg: number;
  ratingCount: number;
  /** Private items take no reviews; see reviewSummary.ratingMode. */
  isPublic?: boolean | null;
}

/**
 * Skill-specific ReviewSection wrapper that uses useSkillReviews hook
 */
export function SkillReviewSection({
  skillId,
  skillSlug,
  userId,
  ratingAvg,
  ratingCount,
  isPublic,
}: SkillReviewSectionProps) {
  const {
    reviews,
    userReview,
    loading,
    submitting,
    submitReview,
    deleteReview,
  } = useSkillReviews(skillId, userId);

  return (
    <GenericReviewSection
      itemId={skillId}
      itemType="skill"
      itemSlug={skillSlug}
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
