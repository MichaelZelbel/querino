import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptForm, type PromptFormData } from "@/components/prompts/PromptForm";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ShieldAlert, GitCompare, Download, Upload, History } from "lucide-react";
import { toast } from "sonner";
import { useAutosave } from "@/hooks/useAutosave";
import { AutosaveIndicator } from "@/components/editors/AutosaveIndicator";
import { DiffViewerModal } from "@/components/editors/DiffViewerModal";
import { DownloadMarkdownButton, ImportMarkdownButton } from "@/components/markdown";
import { VersionHistoryPanel } from "@/components/versions";
import type { Prompt } from "@/types/prompt";
import type { ParsedMarkdown } from "@/lib/markdown";

export default function PromptEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  const [formData, setFormData] = useState<PromptFormData>({
    title: "",
    description: "",
    content: "",
    category: "writing",
    tags: [],
    is_public: false,
  });

  // Autosave
  const handleAutosave = useCallback(async (data: PromptFormData) => {
    if (!user || !id) return;

    const { error } = await supabase
      .from("prompts")
      .update({
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        tags: data.tags.length > 0 ? data.tags : null,
        is_public: data.is_public,
      })
      .eq("id", id)
      .eq("author_id", user.id);

    if (error) throw error;
  }, [id, user]);

  const isOwner = prompt?.author_id === user?.id;

  const { status, lastSaved, hasChanges, resetLastSaved } = useAutosave({
    data: formData,
    onSave: handleAutosave,
    delay: 2000,
    enabled: isOwner && !loading,
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/prompts/${id}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, id]);

  // Fetch prompt
  useEffect(() => {
    async function fetchPrompt() {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from("prompts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching prompt:", error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else if (data.author_id !== user.id) {
          setNotAuthorized(true);
        } else {
          setPrompt(data as Prompt);
          const initialData: PromptFormData = {
            title: data.title,
            description: data.description,
            content: data.content,
            category: data.category,
            tags: data.tags || [],
            is_public: data.is_public,
          };
          setFormData(initialData);
          resetLastSaved(initialData);
        }
      } catch (err) {
        console.error("Error fetching prompt:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchPrompt();
    }
  }, [id, user, resetLastSaved]);

  const handleSubmit = async (data: PromptFormData) => {
    if (!user || !id) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          title: data.title,
          description: data.description,
          content: data.content,
          category: data.category,
          tags: data.tags.length > 0 ? data.tags : null,
          is_public: data.is_public,
        })
        .eq("id", id)
        .eq("author_id", user.id);

      if (error) {
        console.error("Error updating prompt:", error);
        toast.error("Failed to update prompt. Please try again.");
        return;
      }

      resetLastSaved(data);
      toast.success("Prompt updated successfully!");
      navigate(`/prompts/${id}`);
    } catch (err) {
      console.error("Error updating prompt:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/prompts/${id}`);
  };

  const handleFormChange = useCallback((data: PromptFormData) => {
    setFormData(data);
  }, []);

  const handleCreateVersion = async () => {
    if (!user || !id || !prompt) return;

    setIsCreatingVersion(true);
    try {
      // Get the current max version number
      const { data: versions } = await supabase
        .from("prompt_versions")
        .select("version_number")
        .eq("prompt_id", id)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = (versions?.[0]?.version_number || 0) + 1;

      // Create a new version
      const { error } = await supabase.from("prompt_versions").insert({
        prompt_id: id,
        version_number: nextVersion,
        title: formData.title,
        content: formData.content,
        description: formData.description,
        tags: formData.tags,
        change_notes: `Version ${nextVersion} created from diff viewer`,
      });

      if (error) throw error;

      toast.success(`Version ${nextVersion} created!`);
      setShowDiff(false);
    } catch (err) {
      console.error("Error creating version:", err);
      toast.error("Failed to create version");
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleImportMarkdown = (data: ParsedMarkdown) => {
    setFormData({
      title: data.frontmatter.title,
      description: data.frontmatter.description || "",
      content: data.content,
      category: formData.category, // Keep existing category
      tags: data.frontmatter.tags || [],
      is_public: formData.is_public, // Keep existing visibility
    });
  };

  // Compute diff content
  const diffContent = useMemo(() => {
    if (!lastSaved) return { original: "", current: "" };
    return {
      original: lastSaved.content,
      current: formData.content,
    };
  }, [lastSaved, formData.content]);

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
              The prompt you're trying to edit doesn't exist.
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
              You don't have permission to edit this prompt.
            </p>
            <Link to={`/prompts/${id}`}>
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Prompt
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

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Link
            to={`/prompts/${id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Prompt
          </Link>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-display-md font-bold text-foreground">
                Edit Prompt
              </h1>
              <div className="flex items-center gap-4">
                <AutosaveIndicator status={status} />
                <ImportMarkdownButton
                  type="prompt"
                  size="sm"
                  variant="outline"
                  label="Import .md"
                  onImport={handleImportMarkdown}
                  isEditorMode
                />
                <DownloadMarkdownButton
                  title={formData.title || "Untitled Prompt"}
                  type="prompt"
                  description={formData.description}
                  tags={formData.tags}
                  content={formData.content}
                  size="sm"
                  variant="outline"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiff(true)}
                  disabled={!hasChanges}
                  className="gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  View Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionHistory(true)}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  Version History
                </Button>
              </div>
            </div>
            <p className="mt-2 text-muted-foreground">
              Make changes to your prompt below.
            </p>
          </div>

          {prompt && (
            <div className="rounded-xl border border-border bg-card p-6">
              <PromptForm
                initialData={formData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onChange={handleFormChange}
                submitLabel="Save Changes"
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />

      <DiffViewerModal
        open={showDiff}
        onOpenChange={setShowDiff}
        title={formData.title || "Prompt"}
        original={diffContent.original}
        current={diffContent.current}
        onCreateVersion={handleCreateVersion}
        isCreatingVersion={isCreatingVersion}
      />

      {prompt && (
        <VersionHistoryPanel
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          promptId={prompt.id}
          currentPrompt={{
            id: prompt.id,
            title: formData.title,
            description: formData.description,
            content: formData.content,
            tags: formData.tags,
          }}
          onRestoreComplete={() => {
            // Refresh the prompt data after restore
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
