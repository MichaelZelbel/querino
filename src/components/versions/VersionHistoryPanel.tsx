import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Clock,
  Eye,
  RotateCcw,
  GitBranch,
  FileText,
  GitCompare,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { VersionDetailView } from "./VersionDetailView";
import { VersionCompareView } from "./VersionCompareView";

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
  change_notes: string | null;
  created_at: string;
}

interface CurrentPromptData {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[] | null;
}

interface VersionHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string;
  currentPrompt: CurrentPromptData;
  onRestoreComplete?: () => void;
}

type ViewMode = "list" | "detail" | "compare";

export function VersionHistoryPanel({
  open,
  onOpenChange,
  promptId,
  currentPrompt,
  onRestoreComplete,
}: VersionHistoryPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  
  // Restore dialog state
  const [restoringVersion, setRestoringVersion] = useState<PromptVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch versions when panel opens
  useEffect(() => {
    async function fetchVersions() {
      if (!open || !promptId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("prompt_versions")
          .select("*")
          .eq("prompt_id", promptId)
          .order("version_number", { ascending: false });

        if (error) {
          console.error("Error fetching versions:", error);
          toast.error("Failed to load version history");
        } else if (data) {
          setVersions(data as PromptVersion[]);
        }
      } catch (err) {
        console.error("Error fetching versions:", err);
        toast.error("Failed to load version history");
      } finally {
        setLoading(false);
      }
    }

    fetchVersions();
  }, [open, promptId]);

  // Reset view mode when panel closes
  useEffect(() => {
    if (!open) {
      setViewMode("list");
      setSelectedVersion(null);
    }
  }, [open]);

  const handleViewVersion = (version: PromptVersion) => {
    setSelectedVersion(version);
    setViewMode("detail");
  };

  const handleCompareVersion = (version: PromptVersion) => {
    setSelectedVersion(version);
    setViewMode("compare");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedVersion(null);
  };

  const handleRestore = async () => {
    if (!restoringVersion || !promptId || !user) return;

    setIsRestoring(true);
    try {
      // Get current version count to determine next version number
      const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;

      // Create a new version entry for the restoration
      const { error: versionError } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: promptId,
          version_number: nextVersionNumber,
          title: restoringVersion.title,
          description: restoringVersion.description,
          content: restoringVersion.content,
          tags: restoringVersion.tags,
          change_notes: `Restored from version v${restoringVersion.version_number}`,
        });

      if (versionError) {
        console.error("Error creating restore version:", versionError);
        toast.error("Failed to restore version. Please try again.");
        return;
      }

      // Update the main prompt with restored content
      const { error: updateError } = await supabase
        .from("prompts")
        .update({
          title: restoringVersion.title,
          description: restoringVersion.description || "",
          content: restoringVersion.content,
          tags: restoringVersion.tags,
        })
        .eq("id", promptId)
        .eq("author_id", user.id);

      if (updateError) {
        console.error("Error updating prompt:", updateError);
        toast.error("Version entry created but failed to update prompt.");
        return;
      }

      toast.success(`Restored to version v${restoringVersion.version_number}`);
      onOpenChange(false);
      
      if (onRestoreComplete) {
        onRestoreComplete();
      } else {
        navigate(`/library/${promptId}/edit`);
      }
    } catch (err) {
      console.error("Error restoring version:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRestoring(false);
      setRestoringVersion(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === "detail" && selectedVersion) {
      return (
        <VersionDetailView
          version={selectedVersion}
          onBack={handleBackToList}
          onRestore={() => setRestoringVersion(selectedVersion)}
          onCompare={() => handleCompareVersion(selectedVersion)}
        />
      );
    }

    if (viewMode === "compare" && selectedVersion) {
      return (
        <VersionCompareView
          version={selectedVersion}
          currentPrompt={currentPrompt}
          onBack={handleBackToList}
          onRestore={() => setRestoringVersion(selectedVersion)}
        />
      );
    }

    // List view
    if (versions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No versions yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Create versions when editing to track changes and safely roll back if needed.
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-3 p-4">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={index === 0 ? "default" : "secondary"}
                      className="shrink-0 text-xs"
                    >
                      v{version.version_number}
                    </Badge>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {version.title}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  
                  {version.change_notes && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">
                      "{version.change_notes}"
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewVersion(version)}
                  className="shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewVersion(version)}
                  className="gap-1.5 text-xs flex-1"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompareVersion(version)}
                  className="gap-1.5 text-xs flex-1"
                >
                  <GitCompare className="h-3 w-3" />
                  Compare
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRestoringVersion(version)}
                  className="gap-1.5 text-xs flex-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
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
          
          {renderContent()}
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoringVersion} onOpenChange={() => setRestoringVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore version v{restoringVersion?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update your prompt with the content from version v{restoringVersion?.version_number} 
              and create a new version entry. Your current changes will be preserved in the version history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring}
              className="gap-2"
            >
              {isRestoring && <Loader2 className="h-4 w-4 animate-spin" />}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
