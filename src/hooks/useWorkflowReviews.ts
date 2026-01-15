import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReviewWithUser } from "@/types/review";

interface UseWorkflowReviewsResult {
  reviews: ReviewWithUser[];
  userReview: ReviewWithUser | null;
  loading: boolean;
  submitting: boolean;
  submitReview: (rating: number, comment?: string) => Promise<{ error: Error | null }>;
  deleteReview: () => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

export function useWorkflowReviews(workflowId: string | undefined, userId: string | undefined): UseWorkflowReviewsResult {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!workflowId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("workflow_reviews")
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("workflow_id", workflowId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workflow reviews:", error);
        return;
      }

      const transformedReviews: ReviewWithUser[] = (data as any[]).map((item) => ({
        ...item,
        prompt_id: item.workflow_id, // Map to generic interface
        user: item.profiles || null,
        profiles: undefined,
      }));

      setReviews(transformedReviews);

      if (userId) {
        const found = transformedReviews.find((r) => r.user_id === userId);
        setUserReview(found || null);
      }
    } catch (err) {
      console.error("Error fetching workflow reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [workflowId, userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (rating: number, comment?: string): Promise<{ error: Error | null }> => {
    if (!workflowId || !userId) {
      return { error: new Error("Missing workflow or user ID") };
    }

    setSubmitting(true);

    try {
      if (userReview) {
        const { error } = await supabase
          .from("workflow_reviews")
          .update({
            rating,
            comment: comment?.trim() || null,
          })
          .eq("id", userReview.id);

        if (error) {
          console.error("Error updating workflow review:", error);
          return { error: new Error(error.message) };
        }
      } else {
        const { error } = await supabase
          .from("workflow_reviews")
          .insert({
            workflow_id: workflowId,
            user_id: userId,
            rating,
            comment: comment?.trim() || null,
          });

        if (error) {
          console.error("Error creating workflow review:", error);
          return { error: new Error(error.message) };
        }
      }

      await fetchReviews();
      return { error: null };
    } catch (err) {
      console.error("Error submitting workflow review:", err);
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
        .from("workflow_reviews")
        .delete()
        .eq("id", userReview.id);

      if (error) {
        console.error("Error deleting workflow review:", error);
        return { error: new Error(error.message) };
      }

      await fetchReviews();
      return { error: null };
    } catch (err) {
      console.error("Error deleting workflow review:", err);
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
