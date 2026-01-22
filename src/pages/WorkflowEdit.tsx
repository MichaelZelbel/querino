import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, X, ArrowLeft, Trash2, Save, GitBranch, FileText, Sparkles, Lock } from "lucide-react";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { toast } from "sonner";
import { DownloadMarkdownButton, ImportMarkdownButton } from "@/components/markdown";
import { categoryOptions } from "@/types/prompt";
import type { Workflow } from "@/types/workflow";
import type { ParsedMarkdown } from "@/lib/markdown";

interface WorkflowFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
}

export default function WorkflowEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isPremium } = usePremiumCheck();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  
  // AI metadata suggestion state
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<WorkflowFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    tags: [],
    isPublic: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [changeNotes, setChangeNotes] = useState("");

  // Get the workflow ID for database operations
  const workflowId = workflow?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/workflows/${slug}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, slug]);

  useEffect(() => {
    async function fetchWorkflow() {
      if (!slug || !user) return;

      try {
        const { data, error } = await (supabase
          .from("workflows") as any)
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error || !data) {
          toast.error("Workflow not found");
          navigate("/library");
          return;
        }

        if (data.author_id !== user.id) {
          toast.error("You don't have permission to edit this workflow");
          navigate("/library");
          return;
        }

        setWorkflow(data);
        
        // Handle content - use new content field, or fall back to json for legacy
        let workflowContent = data.content || "";
        if (!workflowContent && data.json) {
          workflowContent = typeof data.json === 'string' ? data.json : JSON.stringify(data.json, null, 2);
        }
        
        setFormData({
          title: data.title,
          description: data.description || "",
          content: workflowContent,
          category: data.category || "",
          tags: data.tags || [],
          isPublic: data.published ?? false,
        });
      } catch (err) {
        console.error("Error fetching workflow:", err);
        toast.error("Failed to load workflow");
        navigate("/library");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchWorkflow();
    }
  }, [slug, user, navigate]);

  const normalizeTag = (tag: string) => {
    return tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const normalized = normalizeTag(tagInput);
      if (normalized && !formData.tags.includes(normalized)) {
        setFormData({ ...formData, tags: [...formData.tags, normalized] });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tagToRemove) });
  };

  const handleSuggestMetadata = async () => {
    if (!formData.content.trim()) {
      setMetadataError("Please add some workflow content first.");
      return;
    }

    setIsGeneratingMetadata(true);
    setMetadataError(null);

    try {
      const response = await fetch("https://agentpool.app.n8n.cloud/webhook/suggest-workflow-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_content: formData.content.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const result = await response.json();
      const data = result.output || result;

      if (data.title) {
        setFormData(prev => ({ ...prev, title: data.title }));
      }
      
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
      }
      
      if (data.category) {
        const matchedCategory = categoryOptions.find(cat => 
          cat.id.toLowerCase() === data.category.toLowerCase()
        );
        if (matchedCategory) {
          setFormData(prev => ({ ...prev, category: matchedCategory.id }));
        }
      }
      
      if (data.tags && Array.isArray(data.tags)) {
        const newTags = data.tags
          .map((tag: string) => normalizeTag(tag))
          .filter((tag: string) => tag)
          .slice(0, 10);
        setFormData(prev => ({ ...prev, tags: newTags }));
      }
    } catch (error) {
      console.error("Error suggesting metadata:", error);
      setMetadataError("Could not generate suggestions. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !workflowId) return;

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Workflow content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        content: formData.content.trim(),
        category: formData.category || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        published: formData.isPublic,
      };

      const { error } = await (supabase.from("workflows") as any)
        .update(updateData)
        .eq("id", workflowId);

      if (error) {
        console.error("Error updating workflow:", error);
        toast.error("Failed to update workflow");
        return;
      }

      toast.success("Changes saved!");
    } catch (err) {
      console.error("Error updating workflow:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!user || !workflowId) return;

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Workflow content is required");
      return;
    }

    setIsSavingVersion(true);

    try {
      // First save the changes to the main workflow record
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        content: formData.content.trim(),
        category: formData.category || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        published: formData.isPublic,
      };

      const { error } = await (supabase.from("workflows") as any)
        .update(updateData)
        .eq("id", workflowId);

      if (error) {
        console.error("Error updating workflow:", error);
        toast.error("Failed to save changes");
        return;
      }

      // Note: Workflow versioning table doesn't exist yet - this is a placeholder
      // When workflow_versions table is created, add version creation logic here
      
      setChangeNotes("");
      toast.success("Workflow saved! (Versioning not yet available for workflows)");
    } catch (err) {
      console.error("Error saving workflow:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleDelete = async () => {
    if (!workflowId) return;

    setIsDeleting(true);
    try {
      const { error } = await (supabase.from("workflows") as any)
        .delete()
        .eq("id", workflowId);

      if (error) throw error;

      toast.success("Workflow deleted");
      navigate("/library");
    } catch (err) {
      console.error("Error deleting workflow:", err);
      toast.error("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportMarkdown = (data: ParsedMarkdown) => {
    setFormData({
      title: data.frontmatter.title || formData.title,
      description: data.frontmatter.description || "",
      content: data.content,
      category: formData.category,
      tags: data.frontmatter.tags || [],
      isPublic: formData.isPublic,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !workflow) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Top Navigation & Actions */}
          <div className="mb-6 flex items-center justify-between">
            <Link 
              to="/library" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <ImportMarkdownButton
                type="workflow"
                size="sm"
                variant="outline"
                label="Import .md"
                onImport={handleImportMarkdown}
                isEditorMode
              />
              <DownloadMarkdownButton
                title={formData.title || "Untitled Workflow"}
                type="workflow"
                description={formData.description}
                tags={formData.tags}
                content={formData.content}
                size="sm"
                variant="outline"
              />
              <Button
                onClick={handleSaveChanges}
                disabled={isSubmitting || isSavingVersion}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
              <Button
                onClick={handleSaveAsNewVersion}
                disabled={isSubmitting || isSavingVersion}
                variant="secondary"
                className="gap-2"
              >
                {isSavingVersion ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GitBranch className="h-4 w-4" />
                )}
                Save as New Version
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your workflow.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Editor Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="mb-6 text-xl font-semibold text-foreground">
              Edit Workflow
            </h1>

            <div className="space-y-6">
              {/* Workflow Markdown Content - FIRST */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="content">Workflow Markdown *</Label>
                </div>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={`# My Workflow

## Description
Describe what this workflow does...

## Steps
1. First step...
2. Second step...`}
                  rows={14}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Write your workflow instructions in Markdown format.
                </p>
              </div>

              {/* AI Metadata Suggestion Button */}
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSuggestMetadata}
                          disabled={!isPremium || isGeneratingMetadata || !formData.content.trim()}
                          className="gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          {isGeneratingMetadata ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Generating…
                            </>
                          ) : (
                            <>
                              {!isPremium && <Lock className="h-3.5 w-3.5" />}
                              <Sparkles className="h-3.5 w-3.5" />
                              Suggest title, description, category & tags
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isPremium && (
                      <TooltipContent>
                        <p>AI-assisted metadata is a Premium feature</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                
                {metadataError && (
                  <p className="text-sm text-destructive">{metadataError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Code Review Workflow"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this workflow does..."
                  rows={2}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Press Enter to add tags..."
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="visibility" className="text-base">
                    Make this workflow public
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPublic
                      ? "Anyone can discover and use this workflow"
                      : "Only you can see this workflow"}
                  </p>
                </div>
                <Switch
                  id="visibility"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>

              {/* Change Notes (for versioning) */}
              <div className="space-y-2">
                <Label htmlFor="changeNotes">Change Notes (for new version)</Label>
                <Textarea
                  id="changeNotes"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="Optional: Describe what changed in this version"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  These notes will be saved when you click "Save as New Version"
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
