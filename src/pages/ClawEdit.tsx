import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
import { Loader2, X, ArrowLeft, Trash2, Save, Grab, GitBranch, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import type { Claw } from "@/types/claw";
import { DownloadMarkdownButton, ImportMarkdownButton } from "@/components/markdown";
import type { ParsedMarkdown } from "@/lib/markdown";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";
import { useClawVersions, useCreateClawVersion } from "@/hooks/useClawVersions";

interface ClawFormData {
  title: string;
  description: string;
  content: string; // Legacy or inline SKILL.md content
  category: string;
  tags: string[];
  isPublic: boolean;
  // Skill source fields
  skillSourceType: 'inline' | 'github' | 'clawhub';
  skillSourceRef: string | null; // URL for github/clawhub
  skillSourcePath: string | null;
  skillSourceVersion: string | null;
  skillMdContent: string | null; // Editable for inline
  skillMdCached: string | null; // Read-only for github
}

export default function ClawEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { teams } = useWorkspace();
  const { isPremium } = usePremiumCheck();
  const { checkCredits } = useAICreditsGate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claw, setClaw] = useState<Claw | null>(null);
  const [formData, setFormData] = useState<ClawFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    tags: [],
    isPublic: false,
    skillSourceType: 'inline',
    skillSourceRef: null,
    skillSourcePath: null,
    skillSourceVersion: null,
    skillMdContent: null,
    skillMdCached: null,
  });
  const [tagInput, setTagInput] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const clawId = claw?.id;
  
  // Version hooks
  const { data: versions = [] } = useClawVersions(clawId);
  const createVersion = useCreateClawVersion();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/claws/${slug}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, slug]);

  useEffect(() => {
    async function fetchClaw() {
      if (!slug || !user) return;

      try {
        const { data, error } = await (supabase.from("claws") as any)
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error || !data) {
          toast.error("Claw not found");
          navigate("/library");
          return;
        }

        // Check if user can edit: author OR team member
        const isAuthor = data.author_id === user.id;
        const isTeamClaw = !!data.team_id;
        const userTeamMembership = isTeamClaw 
          ? teams.find(t => t.id === data.team_id) 
          : null;
        const canEditTeamClaw = userTeamMembership?.role === 'owner' || 
                                 userTeamMembership?.role === 'admin' || 
                                 userTeamMembership?.role === 'member';
        const canEdit = isAuthor || canEditTeamClaw;

        if (!canEdit) {
          toast.error("You don't have permission to edit this claw");
          navigate("/library");
          return;
        }

        setClaw(data);
        setFormData({
          title: data.title,
          description: data.description || "",
          content: data.skill_md_content || data.content || "",
          category: data.category || "",
          tags: data.tags || [],
          isPublic: data.published ?? false,
          skillSourceType: (data.skill_source_type as 'inline' | 'github' | 'clawhub') || 'inline',
          skillSourceRef: data.skill_source_ref || null,
          skillSourcePath: data.skill_source_path || null,
          skillSourceVersion: data.skill_source_version || null,
          skillMdContent: data.skill_md_content || null,
          skillMdCached: data.skill_md_cached || null,
        });
      } catch (err) {
        console.error("Error fetching claw:", err);
        toast.error("Failed to load claw");
        navigate("/library");
      } finally {
        setLoading(false);
      }
    }

    if (user && teams) {
      fetchClaw();
    }
  }, [slug, user, navigate, teams]);

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
    if (!checkCredits()) return;
    if (!formData.content.trim()) {
      setMetadataError("Please add some claw content first.");
      return;
    }
    setIsGeneratingMetadata(true);
    setMetadataError(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("suggest-claw-metadata", {
        body: { claw_content: formData.content.trim(), user_id: user?.id },
      });

      if (error) throw new Error("Failed to generate suggestions");

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
        const normalizedTags = data.tags
          .map((tag: string) => normalizeTag(tag))
          .filter((tag: string) => tag)
          .slice(0, 10);
        setFormData(prev => ({ ...prev, tags: normalizedTags }));
      }
      toast.success("Metadata suggestions applied!");
    } catch (error) {
      console.error("Error suggesting metadata:", error);
      setMetadataError("Could not generate suggestions. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !clawId) return;

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Claw content is required");
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

      const { error } = await (supabase.from("claws") as any)
        .update(updateData)
        .eq("id", clawId);

      if (error) {
        console.error("Error updating claw:", error);
        toast.error("Failed to update claw");
        return;
      }

      toast.success("Changes saved!");
    } catch (err) {
      console.error("Error updating claw:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!user || !clawId) return;

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    // Only require content for inline claws
    if (formData.skillSourceType === 'inline' && !formData.content.trim()) {
      toast.error("SKILL.md content is required");
      return;
    }

    setIsSavingVersion(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        content: formData.content.trim(),
        skill_md_content: formData.content.trim(),
        category: formData.category || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        published: formData.isPublic,
      };

      const { error } = await (supabase.from("claws") as any)
        .update(updateData)
        .eq("id", clawId);

      if (error) {
        console.error("Error updating claw:", error);
        toast.error("Failed to save changes");
        return;
      }

      // Create version entry
      const nextVersionNumber = versions.length > 0 
        ? Math.max(...versions.map(v => v.version_number)) + 1 
        : 1;

      await createVersion.mutateAsync({
        claw_id: clawId,
        version_number: nextVersionNumber,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        content: formData.content.trim(),
        skill_md_content: formData.content.trim(),
        tags: formData.tags.length > 0 ? formData.tags : null,
        change_notes: changeNotes.trim() || null,
      });

      setChangeNotes("");
      toast.success(`Saved as version v${nextVersionNumber}`);
    } catch (err) {
      console.error("Error saving claw:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleDelete = async () => {
    if (!clawId) return;

    setIsDeleting(true);
    try {
      const { error } = await (supabase.from("claws") as any)
        .delete()
        .eq("id", clawId);

      if (error) throw error;

      toast.success("Claw deleted");
      navigate("/library");
    } catch (err) {
      console.error("Error deleting claw:", err);
      toast.error("Failed to delete claw");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportMarkdown = (data: ParsedMarkdown) => {
    setFormData(prev => ({
      ...prev,
      title: data.frontmatter.title || prev.title,
      description: data.frontmatter.description || "",
      content: data.content,
      tags: data.frontmatter.tags || [],
      skillMdContent: data.content,
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !claw) {
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
                type="claw"
                size="sm"
                variant="outline"
                label="Import .md"
                onImport={handleImportMarkdown}
                isEditorMode
              />
              <DownloadMarkdownButton
                title={formData.title || "Untitled Claw"}
                type="claw"
                description={formData.description}
                tags={formData.tags}
                content={formData.content}
                size="sm"
                variant="outline"
              />
              <Button
                onClick={handleSaveChanges}
                disabled={isSubmitting || isSavingVersion}
                className="gap-2 bg-amber-500 hover:bg-amber-600"
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
                    <AlertDialogTitle>Delete this claw?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your claw.
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
            <div className="flex items-center gap-2 mb-6">
              <Grab className="h-5 w-5 text-amber-500" />
              <h1 className="text-xl font-semibold text-foreground">Edit Claw</h1>
            </div>

            <div className="space-y-6">
              {/* Source Type Info */}
              {formData.skillSourceType !== 'inline' && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {formData.skillSourceType === 'github' ? 'GitHub Claw' : 'External Reference'}
                    </Badge>
                  </div>
                  {formData.skillSourceRef && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Source URL</Label>
                      <a 
                        href={formData.skillSourceRef} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline truncate"
                      >
                        {formData.skillSourceRef}
                      </a>
                    </div>
                  )}
                  {formData.skillSourcePath && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Path</Label>
                      <p className="text-sm font-mono">{formData.skillSourcePath}</p>
                    </div>
                  )}
                  {formData.skillSourceVersion && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Version</Label>
                      <p className="text-sm font-mono">{formData.skillSourceVersion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SKILL.md Content - Only show for inline or if there's cached content from GitHub */}
              {(formData.skillSourceType === 'inline' || formData.skillMdCached || formData.content) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Grab className="h-4 w-4 text-amber-500" />
                    <Label htmlFor="content">
                      {formData.skillSourceType === 'inline' ? 'SKILL.md *' : 'SKILL.md (cached)'}
                    </Label>
                  </div>
                  {formData.skillSourceType === 'inline' ? (
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={`# Claw Name

## Description
This Claw represents a callable capability...

## Parameters
- \`param1\`: Description...

## Behavior
Describe what this claw does when invoked...`}
                      rows={14}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-[400px] overflow-auto">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                        {formData.skillMdCached || formData.content || '(No SKILL.md content available)'}
                      </pre>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.skillSourceType === 'inline' 
                      ? "Define your Claw's behavior in Markdown format."
                      : formData.skillSourceType === 'github'
                        ? "This content was fetched from GitHub. To edit, change to inline mode."
                        : "External references don't have editable content."}
                  </p>
                </div>
              )}

              {/* External Reference Note */}
              {formData.skillSourceType === 'clawhub' && !formData.skillMdCached && !formData.content && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This Claw is an external reference. The SKILL.md content is not stored locally.
                    Visit the source URL to view the full definition.
                  </p>
                </div>
              )}

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
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : isPremium ? (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Suggest title, description, category & tags
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Suggest title, description, category & tags
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isPremium && (
                      <TooltipContent>
                        <p>Premium feature – upgrade to use AI suggestions</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {metadataError && (
                  <p className="text-sm text-destructive">{metadataError}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Search Documents Claw"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this claw does..."
                  rows={2}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
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

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
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
                  <Label className="text-base">Make this claw public</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPublic
                      ? "Anyone can discover this claw"
                      : "Only you can see this claw"}
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(v) => setFormData({ ...formData, isPublic: v })}
                />
              </div>

              {/* Change Notes (for versioning) */}
              <div className="space-y-2">
                <Label htmlFor="changeNotes">Change Notes (optional)</Label>
                <Textarea
                  id="changeNotes"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Notes will be saved when using "Save as New Version"
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
