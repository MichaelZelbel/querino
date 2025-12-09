import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Eye,
  RotateCcw,
  Clock,
  FileText,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  short_description: string | null;
  content: string;
  tags: string[] | null;
  change_notes: string | null;
  created_at: string;
}

interface Prompt {
  id: string;
  title: string;
  author_id: string | null;
}

export default function VersionHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  
  // View modal state
  const [viewingVersion, setViewingVersion] = useState<PromptVersion | null>(null);
  
  // Restore dialog state
  const [restoringVersion, setRestoringVersion] = useState<PromptVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/library/${id}/versions`, { replace: true });
    }
  }, [user, authLoading, navigate, id]);

  // Fetch prompt and versions
  useEffect(() => {
    async function fetchData() {
      if (!id || !user) return;

      try {
        // Fetch prompt
        const { data: promptData, error: promptError } = await supabase
          .from("prompts")
          .select("id, title, author_id")
          .eq("id", id)
          .maybeSingle();

        if (promptError) {
          console.error("Error fetching prompt:", promptError);
          setNotFound(true);
          return;
        }

        if (!promptData) {
          setNotFound(true);
          return;
        }

        if (promptData.author_id !== user.id) {
          setNotAuthorized(true);
          return;
        }

        setPrompt(promptData);

        // Fetch versions
        const { data: versionsData, error: versionsError } = await supabase
          .from("prompt_versions")
          .select("*")
          .eq("prompt_id", id)
          .order("version_number", { ascending: false });

        if (versionsError) {
          console.error("Error fetching versions:", versionsError);
        } else if (versionsData) {
          setVersions(versionsData as PromptVersion[]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [id, user]);

  const handleRestore = async () => {
    if (!restoringVersion || !id || !user) return;

    setIsRestoring(true);
    try {
      // Get current version count to determine next version number
      const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;

      // Create a new version entry for the restoration
      const { error: versionError } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: id,
          version_number: nextVersionNumber,
          title: restoringVersion.title,
          short_description: restoringVersion.short_description,
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
          short_description: restoringVersion.short_description || "",
          content: restoringVersion.content,
          tags: restoringVersion.tags,
        })
        .eq("id", id)
        .eq("author_id", user.id);

      if (updateError) {
        console.error("Error updating prompt:", updateError);
        toast.error("Version entry created but failed to update prompt.");
        return;
      }

      toast.success(`Restored to version v${restoringVersion.version_number}`);
      navigate(`/library/${id}/edit`);
    } catch (err) {
      console.error("Error restoring version:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRestoring(false);
      setRestoringVersion(null);
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Prompt Not Found
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The prompt you're looking for doesn't exist.
            </p>
            <Link to="/library">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Not Authorized
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              You don't have permission to view this prompt's version history.
            </p>
            <Link to="/library">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Navigation */}
          <Link
            to={`/library/${id}/edit`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Edit
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <GitBranch className="h-6 w-6 text-primary" />
              <h1 className="text-display-sm font-bold text-foreground">
                Version History
              </h1>
            </div>
            <p className="text-muted-foreground">
              Your saved versions of "{prompt?.title}"
            </p>
          </div>

          {/* Version List */}
          {versions.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                No versions yet
              </h2>
              <p className="mb-6 text-muted-foreground">
                Use "Save as New Version" on the edit page to create version snapshots.
              </p>
              <Link to={`/library/${id}/edit`}>
                <Button>Go to Edit Page</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant={index === 0 ? "default" : "secondary"}
                          className="shrink-0"
                        >
                          v{version.version_number}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-foreground mb-1 truncate">
                        {version.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      
                      {version.change_notes && (
                        <p className="text-sm text-muted-foreground italic">
                          "{version.change_notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingVersion(version)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRestoringVersion(version)}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* View Version Modal */}
      <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="secondary">v{viewingVersion?.version_number}</Badge>
              <span className="truncate">{viewingVersion?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4">
            {viewingVersion?.change_notes && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Change notes:</span>{" "}
                  {viewingVersion.change_notes}
                </p>
              </div>
            )}

            {viewingVersion?.short_description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Description</h4>
                <p className="text-sm text-muted-foreground">{viewingVersion.short_description}</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                Prompt Content
              </h4>
              <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-[400px] overflow-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                  {viewingVersion?.content}
                </pre>
              </div>
            </div>

            {viewingVersion?.tags && viewingVersion.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingVersion.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <Clock className="inline-block h-4 w-4 mr-1" />
              Created on{" "}
              {viewingVersion &&
                format(new Date(viewingVersion.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setViewingVersion(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setViewingVersion(null);
                setRestoringVersion(viewingVersion);
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restore This Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
