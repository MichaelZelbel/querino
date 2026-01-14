import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Loader2, X, ArrowLeft, Trash2, GitCompare, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAutosave } from "@/hooks/useAutosave";
import { AutosaveIndicator } from "@/components/editors/AutosaveIndicator";
import { DiffViewerModal } from "@/components/editors/DiffViewerModal";
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  
  const [formData, setFormData] = useState<WorkflowFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    tags: [],
    isPublic: false,
  });
  const [tagInput, setTagInput] = useState("");

  // Autosave handler
  const handleAutosave = useCallback(async (data: WorkflowFormData) => {
    if (!user || !id) return;

    const { error } = await (supabase.from("workflows") as any)
      .update({
        title: data.title.trim(),
        description: data.description.trim() || null,
        content: data.content.trim(),
        category: data.category || null,
        tags: data.tags.length > 0 ? data.tags : null,
        published: data.isPublic,
      })
      .eq("id", id);

    if (error) throw error;
  }, [id, user]);

  const isOwner = workflow?.author_id === user?.id;

  const { status, lastSaved, hasChanges, resetLastSaved } = useAutosave({
    data: formData,
    onSave: handleAutosave,
    delay: 2000,
    enabled: isOwner && !loading,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/workflows/${id}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, id]);

  useEffect(() => {
    async function fetchWorkflow() {
      if (!id || !user) return;

      try {
        const { data, error } = await (supabase
          .from("workflows") as any)
          .select("*")
          .eq("id", id)
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
          // Legacy: stringify JSON for old workflows
          workflowContent = typeof data.json === 'string' ? data.json : JSON.stringify(data.json, null, 2);
        }
        
        const initialData: WorkflowFormData = {
          title: data.title,
          description: data.description || "",
          content: workflowContent,
          category: data.category || "",
          tags: data.tags || [],
          isPublic: data.published ?? false,
        };
        setFormData(initialData);
        resetLastSaved(initialData);
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
  }, [id, user, navigate, resetLastSaved]);

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

  const handleSubmit = async () => {
    if (!user || !id) return;

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
        .eq("id", id);

      if (error) {
        console.error("Error updating workflow:", error);
        toast.error("Failed to update workflow");
        return;
      }

      resetLastSaved({ ...formData, isPublic: formData.isPublic });
      toast.success("Workflow saved!");
      navigate(`/workflows/${workflow?.slug || id}`);
    } catch (err) {
      console.error("Error updating workflow:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const { error } = await (supabase.from("workflows") as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Workflow deleted");
      navigate("/library");
    } catch (err) {
      console.error("Error deleting workflow:", err);
      toast.error("Failed to delete workflow");
    }
  };

  // Diff content for comparison
  const diffContent = useMemo(() => {
    if (!lastSaved) return { original: "", current: "" };
    
    return {
      original: lastSaved.content,
      current: formData.content,
    };
  }, [lastSaved, formData.content]);

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

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Link 
            to="/library" 
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-display-md font-bold text-foreground">
                Edit Workflow
              </h1>
              <p className="mt-2 text-muted-foreground">
                Update your Antigravity workflow.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AutosaveIndicator status={status} />
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
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Save Workflow
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <DiffViewerModal
        open={showDiff}
        onOpenChange={setShowDiff}
        title={formData.title || "Workflow"}
        original={diffContent.original}
        current={diffContent.current}
        showVersionButton={false}
      />
    </div>
  );
}
