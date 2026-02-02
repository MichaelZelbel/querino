import { useAuthContext } from "@/contexts/AuthContext";
import { useClawReviews } from "@/hooks/useClawReviews";
import { StarRating } from "@/components/prompts/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface ClawReviewSectionProps {
  clawId: string;
  authorId?: string;
}

export function ClawReviewSection({ clawId, authorId }: ClawReviewSectionProps) {
  const { user } = useAuthContext();
  const { reviews, isLoading, submitReview, deleteReview } = useClawReviews(clawId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const isAuthor = user && user.id === authorId;

  const handleSubmit = () => {
    if (!user || rating === 0) return;
    submitReview.mutate({ rating, comment, userId: user.id });
    setRating(0);
    setComment("");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>

      {/* Submit Review Form */}
      {user && !isAuthor && !userReview && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Your Rating:</span>
            <StarRating rating={rating} onRate={setRating} />
          </div>
          <Textarea
            placeholder="Share your thoughts about this claw..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitReview.isPending}
          >
            {submitReview.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(review.profiles?.display_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {review.profiles?.display_name || "Anonymous"}
                    </p>
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>
                </div>
                {user && review.user_id === user.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReview.mutate(review.id)}
                    disabled={deleteReview.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              {review.comment && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
