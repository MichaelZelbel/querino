import { format } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAICredits } from "@/hooks/useAICredits";

export function CreditsDisplay() {
  const { credits, isLoading } = useAICredits();

  if (isLoading) {
    return (
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading credits...</span>
        </div>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  const { creditsGranted, remainingCredits, rolloverCredits, periodEnd, planBaseCredits } = credits;
  
  // Provide fallback for planBaseCredits to avoid undefined errors
  const effectivePlanCredits = planBaseCredits ?? 1500;
  
  // Total credits available = plan base + any rollover
  // But for display purposes, use plan credits as the total (matching Lovable UI)
  const displayTotal = effectivePlanCredits + (rolloverCredits || 0);
  
  // Calculate percentage for progress bar based on plan total (with rollover)
  const usagePercentage = displayTotal > 0 
    ? Math.min((remainingCredits / displayTotal) * 100, 100) 
    : 0;
  
  // Calculate the rollover portion of the progress bar
  const rolloverPercentage = displayTotal > 0 
    ? Math.min((rolloverCredits / displayTotal) * 100, 100) 
    : 0;

  // Format the reset date
  const resetDate = periodEnd ? format(new Date(periodEnd), "dd MMM 'at' h:mm a") : null;
  
  // Max rollover is capped at the plan's monthly credits
  const maxRollover = effectivePlanCredits;

  return (
    <div className="mt-6 pt-6 border-t border-border">
      {/* Header with remaining / total */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">AI Credits remaining</span>
        <span className="text-sm text-muted-foreground">
          {Math.round(remainingCredits).toLocaleString()} of {displayTotal.toLocaleString()}
        </span>
      </div>

      {/* Progress bar with rollover indicator - using primary/20 for light blue background */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
        {/* Main remaining credits bar */}
        <div 
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
          style={{ width: `${usagePercentage}%` }}
        />
        {/* Rollover credits marker (darker section at the end) */}
        {rolloverCredits > 0 && (
          <div 
            className="absolute top-0 h-full bg-primary/50 border-l border-primary-foreground/30"
            style={{ 
              left: `${Math.max(usagePercentage - rolloverPercentage, 0)}%`,
              width: `${Math.min(rolloverPercentage, usagePercentage)}%`
            }}
          />
        )}
      </div>

      {/* Info lines */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary" />
          <span>Up to {maxRollover.toLocaleString()} credits rollover</span>
        </div>
        {resetDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary" />
            <span>{effectivePlanCredits.toLocaleString()} credits reset on {resetDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
