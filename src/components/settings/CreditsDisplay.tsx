import { format, differenceInDays } from "date-fns";
import { AlertTriangle, Check, Loader2, ArrowRight } from "lucide-react";
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

  const { remainingCredits, rolloverTokens, periodEnd, planBaseCredits, tokensPerCredit } = credits;
  
  // Calculate rollover credits from rollover tokens
  const rolloverCredits = rolloverTokens / tokensPerCredit;
  
  // Provide fallback for planBaseCredits to avoid undefined errors
  const effectivePlanCredits = planBaseCredits ?? 1500;
  
  // Total credits available = plan base + any rollover
  const displayTotal = effectivePlanCredits + rolloverCredits;
  
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

  // Calculate days until reset and potential rollover amount
  const daysUntilReset = periodEnd ? differenceInDays(new Date(periodEnd), new Date()) : null;
  const showRolloverPreview = daysUntilReset !== null && daysUntilReset <= 5 && daysUntilReset >= 0;
  
  // Calculate how many credits will roll over (capped at plan base)
  const projectedRollover = Math.min(Math.round(remainingCredits), maxRollover);

  // Low-credit warning thresholds
  const remainingRatio = displayTotal > 0 ? remainingCredits / displayTotal : 0;
  const isEmpty = remainingCredits <= 0;
  const isLow = !isEmpty && remainingRatio < 0.1;

  return (
    <div className="mt-6 pt-6 border-t border-border">
      {/* Header with remaining / total */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">AI Credits remaining</span>
        <span
          className={`text-sm ${
            isEmpty ? "text-destructive font-medium" : isLow ? "text-warning font-medium" : "text-muted-foreground"
          }`}
        >
          {Math.round(remainingCredits).toLocaleString()} of {Math.round(displayTotal).toLocaleString()}
        </span>
      </div>

      {/* Progress bar with rollover indicator */}
      <div
        className={`relative h-2 w-full overflow-hidden rounded-full ${
          isEmpty ? "bg-destructive/20" : isLow ? "bg-warning/20" : "bg-primary/20"
        }`}
      >
        {/* Main remaining credits bar */}
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${
            isEmpty ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary"
          }`}
          style={{ width: `${usagePercentage}%` }}
        />
        {/* Rollover credits marker (darker section at the end) */}
        {rolloverCredits > 0 && !isLow && !isEmpty && (
          <div 
            className="absolute top-0 h-full bg-primary/50 border-l border-primary-foreground/30"
            style={{ 
              left: `${Math.max(usagePercentage - rolloverPercentage, 0)}%`,
              width: `${Math.min(rolloverPercentage, usagePercentage)}%`
            }}
          />
        )}
      </div>

      {/* Low / empty credits warning */}
      {(isLow || isEmpty) && (
        <div
          className={`mt-3 flex items-start gap-2 text-sm rounded-md px-3 py-2 ${
            isEmpty
              ? "text-destructive bg-destructive/10"
              : "text-warning bg-warning/10"
          }`}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            {isEmpty ? (
              <>
                You've used all your AI credits.{" "}
                {resetDate ? (
                  <>They reset on <strong>{resetDate}</strong>.</>
                ) : (
                  "They will reset at the start of your next billing period."
                )}{" "}
                Need more sooner?{" "}
                <a
                  href="mailto:support@querino.ai"
                  className="underline underline-offset-2 hover:no-underline"
                >
                  Contact support
                </a>
                .
              </>
            ) : (
              <>
                Running low — <strong>{Math.round(remainingCredits).toLocaleString()}</strong>{" "}
                credits left
                {resetDate ? <> until reset on <strong>{resetDate}</strong></> : null}.
              </>
            )}
          </span>
        </div>
      )}

      {/* Rollover preview banner - shown within 5 days of reset */}
      {showRolloverPreview && projectedRollover > 0 && !isEmpty && (
        <div className="mt-3 flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-md px-3 py-2">
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{projectedRollover.toLocaleString()}</strong> credits will carry over to next period
            {daysUntilReset === 0 ? " (today)" : daysUntilReset === 1 ? " (tomorrow)" : ` (in ${daysUntilReset} days)`}
          </span>
        </div>
      )}

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