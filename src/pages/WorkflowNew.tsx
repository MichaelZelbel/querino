import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, X, FileText, FolderOpen, Globe } from "lucide-react";
import { toast } from "sonner";
import { WORKFLOW_SCOPES, type WorkflowScope } from "@/types/workflow";

// Generate a slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export default function WorkflowNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [filenameManuallyEdited, setFilenameManuallyEdited] = useState(false);
  const [scope, setScope] = useState<WorkflowScope>("workspace");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  // Auto-generate filename from title
  const suggestedFilename = useMemo(() => {
    const slug = generateSlug(title);
    return slug ? `${slug}.md` : "";
  }, [title]);

  // Update filename when title changes (if not manually edited)
  useEffect(() => {
    if (!filenameManuallyEdited && suggestedFilename) {
      setFilename(suggestedFilename);
    }
  }, [suggestedFilename, filenameManuallyEdited]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/workflows/new", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const normalizeTag = (tag: string) => {
    return tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const normalized = normalizeTag(tagInput);
      if (normalized && !tags.includes(normalized)) {
        setTags([...tags, normalized]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFilenameChange = (value: string) => {
    setFilename(value);
    setFilenameManuallyEdited(true);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Workflow content is required");
      return;
    }

    // Ensure filename ends with .md
    let finalFilename = filename.trim();
    if (!finalFilename) {
      finalFilename = suggestedFilename || "workflow.md";
    }
    if (!finalFilename.endsWith(".md")) {
      finalFilename += ".md";
    }

    setIsSubmitting(true);

    try {
      const { data: newWorkflow, error } = await (supabase
        .from("workflows") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim(),
          filename: finalFilename,
          scope,
          tags: tags.length > 0 ? tags : null,
          author_id: user.id,
          published: isPublic,
          // Keep json empty for new Antigravity workflows
          json: {},
        })
        .select("slug")
        .single();

      if (error) {
        console.error("Error creating workflow:", error);
        toast.error("Failed to create workflow");
        return;
      }

      toast.success("Workflow created!");
      navigate(`/workflows/${newWorkflow.slug}`);
    } catch (err) {
      console.error("Error creating workflow:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8">
            <h1 className="text-display-md font-bold text-foreground">
              Create New Workflow
            </h1>
            <p className="mt-2 text-muted-foreground">
              Create an Antigravity workflow as a Markdown file.
            </p>
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`# My Workflow

## Description
Describe what this workflow does...

## Steps
1. First step...
2. Second step...

## Example
\`\`\`
Example usage here
\`\`\``}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Code Review Workflow"
              />
            </div>

            {/* Filename */}
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => handleFilenameChange(e.target.value)}
                  placeholder="my-workflow.md"
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-generated from title. Must end with .md
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this workflow does..."
                rows={2}
              />
            </div>

            {/* Scope Selection */}
            <div className="space-y-3">
              <Label>Scope</Label>
              <RadioGroup
                value={scope}
                onValueChange={(value) => setScope(value as WorkflowScope)}
                className="space-y-2"
              >
                {WORKFLOW_SCOPES.map((scopeOption) => (
                  <div
                    key={scopeOption.value}
                    className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={scopeOption.value} id={scopeOption.value} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={scopeOption.value} className="flex items-center gap-2 cursor-pointer">
                        {scopeOption.value === 'workspace' ? (
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                        {scopeOption.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {scopeOption.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
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
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
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
                  {isPublic
                    ? "Anyone can discover and use this workflow"
                    : "Only you can see this workflow"}
                </p>
              </div>
              <Switch
                id="visibility"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workflow
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
    </div>
  );
}
