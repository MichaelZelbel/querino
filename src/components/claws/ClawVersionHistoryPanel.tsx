import { useState } from "react";
import { useClawVersions, useRestoreClawVersion, ClawVersion } from "@/hooks/useClawVersions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, Eye, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ClawVersionHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clawId: string;
  clawTitle: string;
}

export function ClawVersionHistoryPanel({
  open,
  onOpenChange,
  clawId,
  clawTitle,
}: ClawVersionHistoryPanelProps) {
  const { data: versions = [], isLoading } = useClawVersions(clawId);
  const restoreVersion = useRestoreClawVersion();
  const [viewingVersion, setViewingVersion] = useState<ClawVersion | null>(null);

  const handleRestore = async (version: ClawVersion) => {
    const currentMaxVersion = versions.length > 0 
      ? Math.max(...versions.map(v => v.version_number)) 
      : 0;

    try {
      await restoreVersion.mutateAsync({
        clawId,
        version,
        currentVersionNumber: currentMaxVersion,
      });
      toast.success(`Restored to version v${version.version_number}`);
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription>
              View and restore previous versions of "{clawTitle}"
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No version history available yet. Versions are created when you save changes.
              </p>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4 pr-4">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="rounded-lg border border-border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              v{version.version_number}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-medium">{version.title}</p>

                      {version.change_notes && (
                        <p className="text-sm text-muted-foreground italic">
                          "{version.change_notes}"
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingVersion(version)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        {index !== 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(version)}
                            disabled={restoreVersion.isPending}
                            className="gap-1"
                          >
                            {restoreVersion.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Version Detail Modal */}
      <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Version v{viewingVersion?.version_number} - {viewingVersion?.title}
            </DialogTitle>
            <DialogDescription>
              {viewingVersion?.created_at &&
                format(new Date(viewingVersion.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {viewingVersion?.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{viewingVersion.description}</p>
              </div>
            )}

            {viewingVersion?.tags && viewingVersion.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {viewingVersion.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(viewingVersion?.skill_md_content || viewingVersion?.content) && (
              <div>
                <h4 className="text-sm font-medium mb-1">Content</h4>
                <pre className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {viewingVersion?.skill_md_content || viewingVersion?.content}
                </pre>
              </div>
            )}

            {viewingVersion?.change_notes && (
              <div>
                <h4 className="text-sm font-medium mb-1">Change Notes</h4>
                <p className="text-sm text-muted-foreground italic">
                  "{viewingVersion.change_notes}"
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
