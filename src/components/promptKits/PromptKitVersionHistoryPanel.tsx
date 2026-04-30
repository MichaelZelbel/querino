import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Clock, RotateCcw, GitBranch, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export interface PromptKitVersion {
  id: string;
  prompt_kit_id: string;
  version_number: number;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
  change_notes: string | null;
  created_at: string;
}

interface CurrentKitData {
  id: string;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
}

interface PromptKitVersionHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptKitId: string;
  currentKit: CurrentKitData;
  onRestoreComplete?: () => void;
}

export function PromptKitVersionHistoryPanel({
  open, onOpenChange, promptKitId, currentKit, onRestoreComplete,
}: PromptKitVersionHistoryPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [versions, setVersions] = useState<PromptKitVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<PromptKitVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    async function fetchVersions() {
      if (!open || !promptKitId) return;
      setLoading(true);
      try {
        const { data, error } = await (supabase.from("prompt_kit_versions") as any)
          .select("*")
          .eq("prompt_kit_id", promptKitId)
          .order("version_number", { ascending: false });
        if (error) {
          console.error(error);
          toast.error("Failed to load version history");
        } else {
          setVersions((data || []) as PromptKitVersion[]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVersions();
  }, [open, promptKitId]);

  const handleRestore = async () => {
    if (!restoring || !user) return;
    setIsRestoring(true);
    try {
      const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

      const { error: vErr } = await (supabase.from("prompt_kit_versions") as any).insert({
        prompt_kit_id: promptKitId,
        version_number: nextVersion,
        title: restoring.title,
        description: restoring.description,
        content: restoring.content,
        tags: restoring.tags,
        change_notes: `Restored from version v${restoring.version_number}`,
      });
      if (vErr) {
        toast.error("Failed to restore version");
        return;
      }

      const { error: uErr } = await (supabase.from("prompt_kits") as any)
        .update({
          title: restoring.title,
          description: restoring.description,
          content: restoring.content,
          tags: restoring.tags,
        })
        .eq("id", promptKitId)
        .eq("author_id", user.id);
      if (uErr) {
        toast.error("Version saved but failed to update kit");
        return;
      }

      toast.success(`Restored to version v${restoring.version_number}`);
      onOpenChange(false);
      if (onRestoreComplete) onRestoreComplete();
      else navigate(0);
    } finally {
      setIsRestoring(false);
      setRestoring(null);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Version History
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No versions yet</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Create versions when editing to track changes and safely roll back if needed.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-3 p-4">
                {versions.map((version, index) => (
                  <div key={version.id} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                        v{version.version_number}
                      </Badge>
                      {index === 0 && <Badge variant="outline" className="text-xs">Latest</Badge>}
                    </div>
                    <h4 className="text-sm font-medium text-foreground truncate">{version.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                    {version.change_notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">
                        "{version.change_notes}"
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        variant="secondary" size="sm"
                        onClick={() => setRestoring(version)}
                        className="gap-1.5 text-xs w-full"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore this version
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!restoring} onOpenChange={() => setRestoring(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore version v{restoring?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update your prompt kit with the content from version v{restoring?.version_number} and create a new version entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring} className="gap-2">
              {isRestoring && <Loader2 className="h-4 w-4 animate-spin" />}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
