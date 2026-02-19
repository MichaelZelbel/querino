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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, X, ArrowLeft, Trash2, Save, GitBranch, Sparkles, Lock, Bot } from "lucide-react";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";
import { toast } from "sonner";
import { DownloadMarkdownButton, ImportMarkdownButton } from "@/components/markdown";
import { categoryOptions } from "@/types/prompt";
import type { Skill } from "@/types/skill";
import type { ParsedMarkdown } from "@/lib/markdown";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";
import { ArtifactCoachPanel } from "@/components/studio/ArtifactCoachPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { deterministicSessionId } from "@/lib/runCanvasAI";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface SkillFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  language: string;
}

export default function SkillEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isPremium } = usePremiumCheck();
  const { checkCredits } = useAICreditsGate();
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  // AI-undo state
  const [previousContent, setPreviousContent] = useState<string | null>(null);

  // AI metadata suggestion state
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SkillFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    tags: [],
    isPublic: false,
    language: DEFAULT_LANGUAGE,
  });
  const [tagInput, setTagInput] = useState("");
  const [changeNotes, setChangeNotes] = useState("");

  const skillId = skill?.id;

  // Session ID for the coach
  const workspaceScope = currentWorkspace ?? "personal";
  const coachSessionId = skillId && user
    ? deterministicSessionId(workspaceScope, user.id, skillId)
    : "draft";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/skills/${slug}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, slug]);

  useEffect(() => {
    async function fetchSkill() {
      if (!slug || !user) return;
      try {
        const { data, error } = await (supabase.from("skills") as any)
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error || !data) {
          toast.error("Skill not found");
          navigate("/library");
          return;
        }
        if (data.author_id !== user.id) {
          toast.error("You don't have permission to edit this skill");
          navigate("/library");
          return;
        }
        setSkill(data);
        setFormData({
          title: data.title,
          description: data.description || "",
          content: data.content,
          category: data.category || "",
          tags: data.tags || [],
          isPublic: data.published ?? false,
          language: data.language || DEFAULT_LANGUAGE,
        });
      } catch (err) {
        console.error("Error fetching skill:", err);
        toast.error("Failed to load skill");
        navigate("/library");
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchSkill();
  }, [slug, user, navigate]);

  const handleApplyAIContent = (newContent: string) => {
    setPreviousContent(formData.content);
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handleUndoAI = () => {
    if (previousContent !== null) {
      setFormData(prev => ({ ...prev, content: previousContent! }));
      setPreviousContent(null);
    }
  };

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
      setMetadataError("Please add some skill content first.");
      return;
    }
    setIsGeneratingMetadata(true);
    setMetadataError(null);
    try {
      const { data: result, error } = await supabase.functions.invoke("suggest-skill-metadata", {
        body: { skill_content: formData.content.trim(), user_id: user?.id },
      });
      if (error) throw new Error("Failed to generate suggestions");
      const data = result.output || result;
      if (data.title) setFormData(prev => ({ ...prev, title: data.title }));
      if (data.description) setFormData(prev => ({ ...prev, description: data.description }));
      if (data.category) {
        const matched = categoryOptions.find(c => c.id.toLowerCase() === data.category.toLowerCase());
        if (matched) setFormData(prev => ({ ...prev, category: matched.id }));
      }
      if (data.tags && Array.isArray(data.tags)) {
        const newTags = data.tags.map((t: string) => normalizeTag(t)).filter(Boolean).slice(0, 10);
        setFormData(prev => ({ ...prev, tags: newTags }));
      }
    } catch {
      setMetadataError("Could not generate suggestions. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !skillId) return;
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    if (!formData.content.trim()) { toast.error("Content is required"); return; }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from("skills") as any)
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content: formData.content.trim(),
          category: formData.category || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          published: formData.isPublic,
          language: formData.language,
        })
        .eq("id", skillId);
      if (error) { toast.error("Failed to update skill"); return; }
      toast.success("Changes saved!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!user || !skillId) return;
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    if (!formData.content.trim()) { toast.error("Content is required"); return; }
    setIsSavingVersion(true);
    try {
      const { error } = await (supabase.from("skills") as any)
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content: formData.content.trim(),
          category: formData.category || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          published: formData.isPublic,
          language: formData.language,
        })
        .eq("id", skillId);
      if (error) { toast.error("Failed to save changes"); return; }
      setChangeNotes("");
      toast.success("Skill saved! (Versioning not yet available for skills)");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleDelete = async () => {
    if (!skillId) return;
    setIsDeleting(true);
    try {
      const { error } = await (supabase.from("skills") as any).delete().eq("id", skillId);
      if (error) throw error;
      toast.success("Skill deleted");
      navigate("/library");
    } catch {
      toast.error("Failed to delete skill");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportMarkdown = (data: ParsedMarkdown) => {
    setFormData({
      title: data.frontmatter.title,
      description: data.frontmatter.description || "",
      content: data.content,
      category: formData.category,
      tags: data.frontmatter.tags || [],
      isPublic: formData.isPublic,
      language: formData.language,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !skill) return null;

  const coachPanel = (
    <ArtifactCoachPanel
      artifactType="skill"
      artifactId={skillId!}
      canvasContent={formData.content}
      onApplyContent={handleApplyAIContent}
      onUndo={handleUndoAI}
      canUndo={previousContent !== null}
      userId={user.id}
      workspaceId={currentWorkspace === "personal" ? null : currentWorkspace}
      sessionId={coachSessionId}
    />
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-[1600px] px-4">
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
                type="skill"
                size="sm"
                variant="outline"
                label="Import .md"
                onImport={handleImportMarkdown}
                isEditorMode
              />
              <DownloadMarkdownButton
                title={formData.title || "Untitled Skill"}
                type="skill"
                description={formData.description}
                tags={formData.tags}
                content={formData.content}
                size="sm"
                variant="outline"
              />

              {/* Mobile: AI Coach toggle */}
              {isMobile && (
                <Sheet open={showCoachSheet} onOpenChange={setShowCoachSheet}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Bot className="h-4 w-4" />
                      AI Coach
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh] p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Skill Coach</SheetTitle>
                    </SheetHeader>
                    <div className="h-full">{coachPanel}</div>
                  </SheetContent>
                </Sheet>
              )}

              <Button
                onClick={handleSaveChanges}
                disabled={isSubmitting || isSavingVersion}
                className="gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
              <Button
                onClick={handleSaveAsNewVersion}
                disabled={isSubmitting || isSavingVersion}
                variant="secondary"
                className="gap-2"
              >
                {isSavingVersion ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                Save as New Version
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this skill?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your skill.
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

          {/* Main Studio Layout */}
          <div className="flex gap-6">
            {/* Left: Editor */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl border border-border bg-card p-6">
                <h1 className="mb-6 text-xl font-semibold text-foreground">Edit Skill</h1>

                <div className="space-y-6">
                  {/* Skill Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Skill Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter the skill file content..."
                      rows={14}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* AI Metadata Suggestion */}
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
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
                              ) : (
                                <>{!isPremium && <Lock className="h-3.5 w-3.5" />}<Sparkles className="h-3.5 w-3.5" />Suggest title, description, category & tags</>
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!isPremium && (
                          <TooltipContent><p>AI-assisted metadata is a Premium feature</p></TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {metadataError && <p className="text-sm text-destructive">{metadataError}</p>}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Expert Content Writer"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of what this skill does..."
                      rows={2}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
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
                            <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Language */}
                  <LanguageSelect
                    value={formData.language}
                    onChange={(v) => setFormData({ ...formData, language: v })}
                  />

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor="visibility" className="text-base">Make this skill public</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.isPublic ? "Anyone can discover and use this skill" : "Only you can see this skill"}
                      </p>
                    </div>
                    <Switch
                      id="visibility"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                    />
                  </div>

                  {/* Change Notes */}
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

            {/* Right: AI Coach Panel (desktop only) */}
            {!isMobile && (
              <div className="w-[380px] shrink-0 sticky top-24 self-start" style={{ height: "calc(100vh - 12rem)" }}>
                {coachPanel}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
