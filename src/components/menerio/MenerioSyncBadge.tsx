import { CloudUpload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface MenerioSyncBadgeProps {
  menerioSynced?: boolean;
  menerioSyncedAt?: string | null;
}

export function MenerioSyncBadge({ menerioSynced, menerioSyncedAt }: MenerioSyncBadgeProps) {
  if (!menerioSynced) return null;

  const timeAgo = menerioSyncedAt
    ? formatDistanceToNow(new Date(menerioSyncedAt), { addSuffix: true })
    : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <CloudUpload className="h-3.5 w-3.5 text-success" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Synced to Menerio{timeAgo ? ` (last: ${timeAgo})` : ""}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
