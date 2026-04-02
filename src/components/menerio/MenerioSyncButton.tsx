import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CloudUpload, RefreshCw, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface MenerioSyncButtonProps {
  artifactType: "prompt" | "skill" | "claw" | "workflow";
  artifactId: string;
  menerioSynced: boolean;
  menerioSyncedAt: string | null;
  menerioNoteId: string | null;
  onSyncComplete?: () => void;
}

export function MenerioSyncButton({
  artifactType,
  artifactId,
  menerioSynced,
  menerioSyncedAt,
  menerioNoteId,
  onSyncComplete,
}: MenerioSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        return;
      }

      const { data, error } = await supabase.functions.invoke("render-for-menerio", {
        body: { artifact_type: artifactType, artifact_id: artifactId },
      });

      if (error) {
        toast.error(data?.error || error.message || "Sync failed");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Successfully synced to Menerio");
      onSyncComplete?.();
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const syncedAgo = menerioSyncedAt
    ? formatDistanceToNow(new Date(menerioSyncedAt), { addSuffix: true })
    : null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : menerioSynced ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
              {menerioSynced ? "Re-sync" : "Sync to Menerio"}
              {menerioSynced && !syncing && (
                <Check className="h-3.5 w-3.5 text-green-500" />
              )}
            </Button>
          </TooltipTrigger>
          {menerioSynced && syncedAgo && (
            <TooltipContent>
              <p>Last synced: {syncedAgo}</p>
              {menerioNoteId && <p className="text-xs text-muted-foreground">Note ID: {menerioNoteId}</p>}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
