import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReviewWithUser } from "@/types/review";

export interface UseReviewsResult {
  reviews: ReviewWithUser[];
  userReview: ReviewWithUser | null;
  loading: boolean;
  submitting: boolean;
  submitReview: (rating: number, comment?: string) => Promise<{ error: Error | null }>;
  deleteReview: () => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

interface ReviewsConfig {
  /** Reviews table, e.g. "skill_reviews" */
  table: string;
  /** FK column to the reviewed artifact, e.g. "skill_id" */
  idColumn: string;
}

/**
 * Shared reviews hook. The four per-type review hooks were byte-for-byte
 * copies apart from table/column names (and had already drifted in their
 * log strings); they now delegate here.
 */
export function createReviewsHook(config: ReviewsConfig) {
  return function useArtifactReviews(
    itemId: string | undefined,
    userId: string | undefined
  ): UseReviewsResult {
    const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
    const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = useCallback(async () => {
      if (!itemId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase.from(config.table as any) as any)
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq(config.idColumn, itemId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(`Error fetching ${config.table}:`, error);
          return;
        }

        const transformedReviews: ReviewWithUser[] = (data as any[]).map((item) => ({
          ...item,
          // ReviewWithUser is prompt-shaped; map the FK to the generic field.
          prompt_id: item[config.idColumn],
          user: item.profiles || null,
          profiles: undefined,
        }));

        setReviews(transformedReviews);

        if (userId) {
          const found = transformedReviews.find((r) => r.user_id === userId);
          setUserReview(found || null);
        }
      } catch (err) {
        console.error(`Error fetching ${config.table}:`, err);
      } finally {
        setLoading(false);
      }
    }, [itemId, userId]);

    useEffect(() => {
      fetchReviews();
    }, [fetchReviews]);

    const submitReview = async (
      rating: number,
      comment?: string
    ): Promise<{ error: Error | null }> => {
      if (!itemId || !userId) {
        return { error: new Error("Missing item or user ID") };
      }

      setSubmitting(true);

      try {
        if (userReview) {
          const { error } = await (supabase.from(config.table as any) as any)
            .update({
              rating,
              comment: comment?.trim() || null,
            })
            .eq("id", userReview.id);

          if (error) {
            console.error(`Error updating ${config.table} review:`, error);
            return { error: new Error(error.message) };
          }
        } else {
          const { error } = await (supabase.from(config.table as any) as any).insert({
            [config.idColumn]: itemId,
            user_id: userId,
            rating,
            comment: comment?.trim() || null,
          });

          if (error) {
            console.error(`Error creating ${config.table} review:`, error);
            return { error: new Error(error.message) };
          }
        }

        await fetchReviews();
        return { error: null };
      } catch (err) {
        console.error(`Error submitting ${config.table} review:`, err);
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
        const { error } = await (supabase.from(config.table as any) as any)
          .delete()
          .eq("id", userReview.id);

        if (error) {
          console.error(`Error deleting ${config.table} review:`, error);
          return { error: new Error(error.message) };
        }

        await fetchReviews();
        return { error: null };
      } catch (err) {
        console.error(`Error deleting ${config.table} review:`, err);
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
  };
}
