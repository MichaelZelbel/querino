import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClawReview {
  id: string;
  claw_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useClawReviews(clawId: string) {
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["claw-reviews", clawId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("claw_reviews") as any)
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq("claw_id", clawId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClawReview[];
    },
    enabled: !!clawId,
  });

  const submitReview = useMutation({
    mutationFn: async ({ rating, comment, userId }: { rating: number; comment?: string; userId: string }) => {
      const { error } = await (supabase
        .from("claw_reviews") as any)
        .upsert({
          claw_id: clawId,
          user_id: userId,
          rating,
          comment: comment || null,
        }, {
          onConflict: "claw_id,user_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claw-reviews", clawId] });
      toast.success("Review submitted!");
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await (supabase
        .from("claw_reviews") as any)
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claw-reviews", clawId] });
      toast.success("Review deleted");
    },
    onError: () => {
      toast.error("Failed to delete review");
    },
  });

  return {
    reviews,
    isLoading,
    submitReview,
    deleteReview,
  };
}
