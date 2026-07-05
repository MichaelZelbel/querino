import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAICreditsSummary } from "@/hooks/useAICreditsSummary";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Compact AI-credit balance for the header. Links to Settings where the
 * full CreditsDisplay lives.
 */
export function CreditsPill({ className }: { className?: string }) {
  const { data: summary } = useAICreditsSummary();

  if (!summary) return null;

  const remaining = Math.max(0, Math.floor(summary.remainingCredits));
  const isEmpty = remaining === 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/settings"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            isEmpty
              ? "border-destructive/40 text-destructive hover:bg-destructive/10"
              : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
            className
          )}
          aria-label={`${remaining} AI credits remaining`}
        >
          <Zap className="h-3 w-3" />
          {remaining}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        {isEmpty
          ? "Out of AI credits — they reset next period. Manage in Settings."
          : `${remaining} AI credits remaining. Manage in Settings.`}
      </TooltipContent>
    </Tooltip>
  );
}
