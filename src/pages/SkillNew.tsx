import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { ArrowLeft, Loader2, X, Save, Sparkles, Lock, Bot } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";
import { ArtifactCoachPanel } from "@/components/studio/ArtifactCoachPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { getOrCreateDraftSessionId, promoteDraftSession } from "@/lib/runCanvasAI";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function SkillNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isPremium } = usePremiumCheck();
  const { checkCredits } = useAICreditsGate();
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  const [content, setContent] = useState("");
  const [previousContent, setPreviousContent] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI metadata suggestion state
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const workspaceScope = currentWorkspace ?? "personal";
  const draftSessionId = user ? getOrCreateDraftSessionId(workspaceScope, user.id, "skill") : "draft";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/skills/new", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleApplyAIContent = (newContent: string) => {
    setPreviousContent(content);
    setContent(newContent);
  };

  const handleUndoAI = () => {
    if (previousContent !== null) {
      setContent(previousContent);
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
      if (normalized && !tags.includes(normalized)) {
        setTags([...tags, normalized]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!content.trim()) newErrors.content = "Skill content is required";
    if (!title.trim()) newErrors.title = "Title is required";
    if (!category) newErrors.category = "Please select a category";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSuggestMetadata = async () => {
    if (!checkCredits()) return;
    if (!content.trim()) {
      setMetadataError("Please add some skill content first.");
      return;
    }
    setIsGeneratingMetadata(true);
    setMetadataError(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-skill-metadata", {
        body: { skill_content: content.trim(), user_id: user?.id },
      });
      if (error) throw error;
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.category) {
        const matched = categoryOptions.find(c => c.id.toLowerCase() === data.category.toLowerCase());
        if (matched) setCategory(matched.id);
      }
      if (data.tags && Array.isArray(data.tags)) {
        setTags(data.tags.map((t: string) => normalizeTag(t)).filter(Boolean).slice(0, 10));
      }
      toast.success("Metadata suggestions applied!");
    } catch {
      setMetadataError("Could not generate suggestions. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { data: newSkill, error } = await supabase
        .from("skills")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim(),
          category,
          tags: tags.length > 0 ? tags : null,
          author_id: user.id,
          published: isPublic,
          language,
        })
        .select("id, slug")
        .single();

      if (error) {
        toast.error("Failed to create skill");
        return;
      }

      // Promote draft session to deterministic session for the new skill
      if (newSkill?.id) {
        promoteDraftSession(workspaceScope, user.id, newSkill.id, "skill");
      }

      toast.success("Skill created!");
      navigate(`/skills/${newSkill.slug}`);
    } catch {
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

  if (!user) return null;

  const coachPanel = (
    <ArtifactCoachPanel
      artifactType="skill"
      artifactId="draft"
      canvasContent={content}
      onApplyContent={handleApplyAIContent}
      onUndo={handleUndoAI}
      canUndo={previousContent !== null}
      isNew
      userId={user.id}
      workspaceId={currentWorkspace === "personal" ? null : currentWorkspace}
      sessionId={draftSessionId}
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
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Skill
              </Button>
            </div>
          </div>

          {/* Main Studio Layout */}
          <div className="flex gap-6">
            {/* Left: Editor */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl border border-border bg-card p-6">
                <h1 className="mb-6 text-xl font-semibold text-foreground">Create New Skill</h1>

                <div className="space-y-6">
                  {/* Skill Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Skill Content *</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter the skill file content, markdown supported..."
                      rows={14}
                      className={`font-mono text-sm ${errors.content ? "border-destructive" : ""}`}
                    />
                    {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
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
                              disabled={!isPremium || isGeneratingMetadata || !content.trim()}
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
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Expert Content Writer"
                      className={errors.title ? "border-destructive" : ""}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of what this skill does..."
                      rows={2}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
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
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
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
                  <LanguageSelect value={language} onChange={setLanguage} />

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor="visibility" className="text-base">Make this skill public</Label>
                      <p className="text-sm text-muted-foreground">
                        {isPublic ? "Anyone can discover and use this skill" : "Only you can see this skill"}
                      </p>
                    </div>
                    <Switch id="visibility" checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>

                  {/* Bottom Create Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Create Skill
                  </Button>
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
