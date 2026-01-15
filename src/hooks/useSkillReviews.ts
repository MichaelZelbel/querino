import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReviewWithUser } from "@/types/review";

interface UseSkillReviewsResult {
  reviews: ReviewWithUser[];
  userReview: ReviewWithUser | null;
  loading: boolean;
  submitting: boolean;
  submitReview: (rating: number, comment?: string) => Promise<{ error: Error | null }>;
  deleteReview: () => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

export function useSkillReviews(skillId: string | undefined, userId: string | undefined): UseSkillReviewsResult {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!skillId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("skill_reviews")
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("skill_id", skillId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching skill reviews:", error);
        return;
      }

      const transformedReviews: ReviewWithUser[] = (data as any[]).map((item) => ({
        ...item,
        prompt_id: item.skill_id, // Map to generic interface
        user: item.profiles || null,
        profiles: undefined,
      }));

      setReviews(transformedReviews);

      if (userId) {
        const found = transformedReviews.find((r) => r.user_id === userId);
        setUserReview(found || null);
      }
    } catch (err) {
      console.error("Error fetching skill reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [skillId, userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (rating: number, comment?: string): Promise<{ error: Error | null }> => {
    if (!skillId || !userId) {
      return { error: new Error("Missing skill or user ID") };
    }

    setSubmitting(true);

    try {
      if (userReview) {
        const { error } = await supabase
          .from("skill_reviews")
          .update({
            rating,
            comment: comment?.trim() || null,
          })
          .eq("id", userReview.id);

        if (error) {
          console.error("Error updating skill review:", error);
          return { error: new Error(error.message) };
        }
      } else {
        const { error } = await supabase
          .from("skill_reviews")
          .insert({
            skill_id: skillId,
            user_id: userId,
            rating,
            comment: comment?.trim() || null,
          });

        if (error) {
          console.error("Error creating skill review:", error);
          return { error: new Error(error.message) };
        }
      }

      await fetchReviews();
      return { error: null };
    } catch (err) {
      console.error("Error submitting skill review:", err);
      return { error: err instanceof Error ? err : new Error("Unknown error") };
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (): Promise<{ error: Error | null }> => {
    if (!userReview) {
      return { error: new Error("No review to delete") };
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("skill_reviews")
        .delete()
        .eq("id", userReview.id);

      if (error) {
        console.error("Error deleting skill review:", error);
        return { error: new Error(error.message) };
      }

      await fetchReviews();
      return { error: null };
    } catch (err) {
      console.error("Error deleting skill review:", err);
      return { error: err instanceof Error ? err : new Error("Unknown error") };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    reviews,
    userReview,
    loading,
    submitting,
    submitReview,
    deleteReview,
    refetch: fetchReviews,
  };
}
