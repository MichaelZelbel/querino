import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
}

export function StarRating({
  rating,
  onRate,
  size = "md",
  readonly = false,
  showValue = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (index: number) => {
    if (!readonly && onRate) {
      onRate(index);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((index) => {
          const isFilled = index <= displayRating;
          const isHalf = !isFilled && index - 0.5 <= displayRating;

          return (
            <button
              key={index}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(index)}
              onMouseEnter={() => !readonly && setHoverRating(index)}
              onMouseLeave={() => !readonly && setHoverRating(0)}
              className={cn(
                "transition-colors",
                !readonly && "cursor-pointer hover:scale-110",
                readonly && "cursor-default"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors",
                  isFilled
                    ? "fill-warning text-warning"
                    : isHalf
                    ? "fill-warning/50 text-warning"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-1 text-sm font-medium text-foreground">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}
