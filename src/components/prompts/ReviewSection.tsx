import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { usePromptReviews } from "@/hooks/usePromptReviews";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ReviewWithUser } from "@/types/review";

interface ReviewSectionProps {
  promptId: string;
  userId?: string;
  ratingAvg: number;
  ratingCount: number;
}

export function ReviewSection({
  promptId,
  userId,
  ratingAvg,
  ratingCount,
}: ReviewSectionProps) {
  const navigate = useNavigate();
  const { reviews, userReview, loading, submitting, submitReview, deleteReview } =
    usePromptReviews(promptId, userId);
  const [selectedRating, setSelectedRating] = useState(userReview?.rating || 0);
  const [comment, setComment] = useState(userReview?.comment || "");
  const [showForm, setShowForm] = useState(false);

  // Update local state when userReview loads
  useState(() => {
    if (userReview) {
      setSelectedRating(userReview.rating);
      setComment(userReview.comment || "");
    }
  });

  const handleRatingClick = (rating: number) => {
    if (!userId) {
      navigate(`/auth?redirect=/prompts/${promptId}`);
      return;
    }
    setSelectedRating(rating);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    const { error } = await submitReview(selectedRating, comment);
    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success(userReview ? "Review updated!" : "Review submitted!");
      setShowForm(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await deleteReview();
    if (error) {
      toast.error("Failed to delete review");
    } else {
      toast.success("Review deleted");
      setSelectedRating(0);
      setComment("");
      setShowForm(false);
    }
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

  // Get reviews excluding user's own for display
  const displayReviews = reviews.filter((r) => r.user_id !== userId).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Ratings & Reviews</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <StarRating rating={ratingAvg} readonly size="lg" />
            <span className="text-2xl font-bold text-foreground">
              {Number(ratingAvg).toFixed(1)}
            </span>
          </div>
          <span className="text-muted-foreground">
            ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
          </span>
        </div>

        {/* User Rating Section */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            {userReview ? "Your Rating" : "Rate this prompt"}
          </h3>

          {!userId ? (
            <div>
              <StarRating rating={0} readonly size="md" />
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => navigate(`/auth?redirect=/prompts/${promptId}`)}
              >
                Sign in to rate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <StarRating
                rating={selectedRating || userReview?.rating || 0}
                onRate={handleRatingClick}
                size="lg"
              />

              {(showForm || userReview) && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add an optional comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || selectedRating === 0}
                      size="sm"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {userReview ? "Update Review" : "Submit Review"}
                    </Button>
                    {userReview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={submitting}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Reviews</h3>

          {/* User's own review first */}
          {userReview && <ReviewCard review={userReview} isOwn getInitials={getInitials} />}

          {/* Other reviews */}
          {displayReviews.map((review) => (
            <ReviewCard key={review.id} review={review} getInitials={getInitials} />
          ))}

          {reviews.length > 5 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              View all reviews (coming soon)
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ReviewCard({
  review,
  isOwn,
  getInitials,
}: {
  review: ReviewWithUser;
  isOwn?: boolean;
  getInitials: (name: string | null) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={review.user?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-muted">
            {getInitials(review.user?.display_name || null)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {review.user?.display_name || "Anonymous"}
            </span>
            {isOwn && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                You
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(review.created_at), "MMM d, yyyy")}
            </span>
          </div>
          <div className="mt-1">
            <StarRating rating={review.rating} readonly size="sm" />
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
