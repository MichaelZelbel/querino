import { CloudCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface MenerioSyncBadgeProps {
  menerioSynced?: boolean;
  menerioSyncedAt?: string | null;
}

export function MenerioSyncBadge({ menerioSynced, menerioSyncedAt }: MenerioSyncBadgeProps) {
  if (!menerioSynced) return null;

  const timeAgo = menerioSyncedAt
    ? formatDistanceToNow(new Date(menerioSyncedAt), { addSuffix: true, locale: de })
    : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <CloudCheck className="h-3.5 w-3.5 text-success" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Mit Menerio synchronisiert{timeAgo ? ` (zuletzt: ${timeAgo})` : ""}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
