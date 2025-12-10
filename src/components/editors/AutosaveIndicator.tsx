import { Check, Loader2, AlertCircle, Circle } from "lucide-react";
import type { AutosaveStatus } from "@/hooks/useAutosave";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  const statusConfig: Record<AutosaveStatus, { icon: typeof Check; text: string; className: string; animate?: boolean }> = {
    saved: {
      icon: Check,
      text: "Saved",
      className: "text-green-600 dark:text-green-400",
    },
    saving: {
      icon: Loader2,
      text: "Saving…",
      className: "text-muted-foreground",
      animate: true,
    },
    unsaved: {
      icon: Circle,
      text: "Unsaved changes",
      className: "text-amber-600 dark:text-amber-400",
    },
    error: {
      icon: AlertCircle,
      text: "Save failed",
      className: "text-destructive",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.className}`}>
      <Icon className={`h-3.5 w-3.5 ${config.animate ? "animate-spin" : ""}`} />
      <span>{config.text}</span>
    </div>
  );
}
