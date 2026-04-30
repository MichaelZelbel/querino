import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReviewWithUser } from "@/types/review";

interface UsePromptKitReviewsResult {
  reviews: ReviewWithUser[];
  userReview: ReviewWithUser | null;
  loading: boolean;
  submitting: boolean;
  submitReview: (rating: number, comment?: string) => Promise<{ error: Error | null }>;
  deleteReview: () => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

export function usePromptKitReviews(
  kitId: string | undefined,
  userId: string | undefined,
): UsePromptKitReviewsResult {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!kitId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("prompt_kit_reviews")
        .select(`*, profiles:user_id (id, display_name, avatar_url)`)
        .eq("prompt_kit_id", kitId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prompt kit reviews:", error);
        return;
      }

      const transformed: ReviewWithUser[] = (data as any[]).map((item) => ({
        ...item,
        prompt_id: item.prompt_kit_id,
        user: item.profiles || null,
        profiles: undefined,
      }));

      setReviews(transformed);
      if (userId) setUserReview(transformed.find((r) => r.user_id === userId) || null);
    } catch (err) {
      console.error("Error fetching prompt kit reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [kitId, userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (rating: number, comment?: string) => {
    if (!kitId || !userId) return { error: new Error("Missing kit or user ID") };
    setSubmitting(true);
    try {
      if (userReview) {
        const { error } = await (supabase as any)
          .from("prompt_kit_reviews")
          .update({ rating, comment: comment?.trim() || null })
          .eq("id", userReview.id);
        if (error) return { error: new Error(error.message) };
      } else {
        const { error } = await (supabase as any)
          .from("prompt_kit_reviews")
          .insert({ prompt_kit_id: kitId, user_id: userId, rating, comment: comment?.trim() || null });
        if (error) return { error: new Error(error.message) };
      }
      await fetchReviews();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Unknown error") };
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async () => {
    if (!userReview) return { error: new Error("No review to delete") };
    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("prompt_kit_reviews")
        .delete()
        .eq("id", userReview.id);
      if (error) return { error: new Error(error.message) };
      await fetchReviews();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Unknown error") };
    } finally {
      setSubmitting(false);
    }
  };

  return { reviews, userReview, loading, submitting, submitReview, deleteReview, refetch: fetchReviews };
}
