import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReviewWithUser } from "@/types/review";

interface UsePromptReviewsResult {
  reviews: ReviewWithUser[];
  userReview: ReviewWithUser | null;
  loading: boolean;
  submitting: boolean;
  submitReview: (rating: number, comment?: string) => Promise<{ error: Error | null }>;
  deleteReview: () => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

export function usePromptReviews(promptId: string | undefined, userId: string | undefined): UsePromptReviewsResult {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!promptId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("prompt_reviews")
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("prompt_id", promptId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        return;
      }

      const transformedReviews: ReviewWithUser[] = (data as any[]).map((item) => ({
        ...item,
        user: item.profiles || null,
        profiles: undefined,
      }));

      setReviews(transformedReviews);

      // Find user's review if logged in
      if (userId) {
        const found = transformedReviews.find((r) => r.user_id === userId);
        setUserReview(found || null);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [promptId, userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (rating: number, comment?: string): Promise<{ error: Error | null }> => {
    if (!promptId || !userId) {
      return { error: new Error("Missing prompt or user ID") };
    }

    setSubmitting(true);

    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from("prompt_reviews")
          .update({
            rating,
            comment: comment?.trim() || null,
          })
          .eq("id", userReview.id);

        if (error) {
          console.error("Error updating review:", error);
          return { error: new Error(error.message) };
        }
      } else {
        // Insert new review
        const { error } = await supabase
          .from("prompt_reviews")
          .insert({
            prompt_id: promptId,
            user_id: userId,
            rating,
            comment: comment?.trim() || null,
          });

        if (error) {
          console.error("Error creating review:", error);
          return { error: new Error(error.message) };
        }
      }

      // Refetch to get updated data
      await fetchReviews();
      return { error: null };
    } catch (err) {
      console.error("Error submitting review:", err);
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
        .from("prompt_reviews")
        .delete()
        .eq("id", userReview.id);

      if (error) {
        console.error("Error deleting review:", error);
        return { error: new Error(error.message) };
      }

      await fetchReviews();
      return { error: null };
    } catch (err) {
      console.error("Error deleting review:", err);
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
