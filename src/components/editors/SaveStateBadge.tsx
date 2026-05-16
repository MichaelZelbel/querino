import { useEffect, useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveStateBadgeProps {
  isDirty: boolean;
  isSaving: boolean;
  savedAt: Date | null;
  className?: string;
}

function formatRelative(date: Date): string {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

export function SaveStateBadge({ isDirty, isSaving, savedAt, className }: SaveStateBadgeProps) {
  const [, tick] = useState(0);

  // Refresh relative time every 30s while a savedAt exists.
  useEffect(() => {
    if (!savedAt) return;
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [savedAt]);

  if (isSaving) {
    return (
      <div
        className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}
        aria-live="polite"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Saving…</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div
        className={cn("flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400", className)}
        aria-live="polite"
        title="Press ⌘S / Ctrl+S to save"
      >
        <Circle className="h-3.5 w-3.5" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (savedAt) {
    return (
      <div
        className={cn("flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400", className)}
        aria-live="polite"
      >
        <Check className="h-3.5 w-3.5" />
        <span>Saved · {formatRelative(savedAt)}</span>
      </div>
    );
  }

  return null;
}
