import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, ArrowLeft, Wand2, X, Save, Bot, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";
import { PromptCoachPanel } from "@/components/studio/PromptCoachPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { getOrCreateDraftSessionId, promoteDraftSession } from "@/lib/runCanvasAI";

export default function PromptNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { currentWorkspace } = useWorkspace();
  const { isPremium } = usePremiumCheck();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [shortDescription, setShortDescription] = useState(searchParams.get("description") || "");
  const [content, setContent] = useState(searchParams.get("content") || searchParams.get("draft") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(searchParams.get("tags")?.split(",").filter(Boolean) || []);
  const [isPublic, setIsPublic] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI metadata suggestion state
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Undo state for AI edits
  const [previousContent, setPreviousContent] = useState<string | null>(null);

  // Mobile coach sheet
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/prompts/new", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const normalizeTag = (tag: string): string => {
    return tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleAddTag = () => {
    const normalizedTag = normalizeTag(tagInput);
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 10) {
      setTags([...tags, normalizedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSuggestMetadata = async () => {
    if (!content.trim()) {
      setMetadataError("Please add some prompt content first.");
      return;
    }

    setIsGeneratingMetadata(true);
    setMetadataError(null);

    try {
      const response = await supabase.functions.invoke("suggest-metadata", {
        body: { prompt_content: content.trim(), user_id: user?.id },
      });

      if (response.error) throw new Error(response.error.message);

      const result = response.data;
      if (result.title) setTitle(result.title);
      if (result.description) setShortDescription(result.description);
      if (result.category) {
        const matched = categoryOptions.find(cat => cat.id.toLowerCase() === result.category.toLowerCase());
        if (matched) setCategory(matched.id);
      }
      if (result.tags && Array.isArray(result.tags)) {
        setTags(result.tags.map((t: string) => normalizeTag(t)).filter((t: string) => t).slice(0, 10));
      }
    } catch (error) {
      console.error("Error suggesting metadata:", error);
      setMetadataError("Could not generate suggestions. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    else if (title.length > 100) newErrors.title = "Title must be less than 100 characters";
    if (!shortDescription.trim()) newErrors.shortDescription = "Short description is required";
    else if (shortDescription.length > 2000) newErrors.shortDescription = "Description must be less than 2000 characters";
    if (!content.trim()) newErrors.content = "Prompt content is required";
    if (!category) newErrors.category = "Please select a category";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate() || !user) return;

    setIsSubmitting(true);
    try {
      const { data: newPrompt, error } = await supabase
        .from("prompts")
        .insert({
          title: title.trim(),
          description: shortDescription.trim(),
          content: content.trim(),
          category,
          tags: tags.length > 0 ? tags : null,
          is_public: isPublic,
          author_id: user.id,
          rating_avg: 0,
          rating_count: 0,
          copies_count: 0,
          language,
        })
        .select("id, slug")
        .single();

      if (error) {
        console.error("Error creating prompt:", error);
        toast.error("Failed to create prompt. Please try again.");
        return;
      }

      // Create version 1
      await supabase.from("prompt_versions").insert({
        prompt_id: newPrompt.id,
        version_number: 1,
        title: title.trim(),
        description: shortDescription.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : null,
        change_notes: "Initial version",
      });

      // Promote draft coach session to deterministic session for this prompt
      const workspaceScope = currentWorkspace ?? "personal";
      promoteDraftSession(workspaceScope, user.id, newPrompt.id);

      toast.success("Prompt created successfully!");
      navigate(`/prompts/${newPrompt.slug}`);
    } catch (err) {
      console.error("Error creating prompt:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Coach handlers
  const handleApplyAIContent = (newContent: string, _changeNote?: string) => {
    setPreviousContent(content);
    setContent(newContent);
    // No DB writes on /prompts/new — just update state
  };

  const handleUndoAI = () => {
    if (previousContent !== null) {
      setContent(previousContent);
      setPreviousContent(null);
      toast.success("AI edit undone.");
    }
  };

  // Line-numbered editor
  const renderLineNumberedEditor = () => {
    const lines = content.split("\n");
    return (
      <div className="relative">
        <div className="flex">
          <div
            className="select-none pr-3 pt-2 pb-2 text-right font-mono text-xs text-muted-foreground/50 leading-[1.7rem] min-w-[2.5rem] border-r border-border mr-0"
            aria-hidden="true"
          >
            {Array.from({ length: lines.length }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your prompt here..."
            className={`font-mono text-sm border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 leading-[1.7rem] min-h-[300px] resize-y ${errors.content ? "border-destructive" : ""}`}
            style={{ paddingTop: "0.5rem" }}
          />
        </div>
      </div>
    );
  };

  // Coach panel element
  const workspaceScope = currentWorkspace ?? "personal";
  const draftSessionId = user ? getOrCreateDraftSessionId(workspaceScope, user.id) : "draft";

  const coachPanel = (
    <PromptCoachPanel
      isNewPrompt
      artifactId="draft"
      canvasContent={content}
      onApplyContent={handleApplyAIContent}
      onUndo={handleUndoAI}
      canUndo={previousContent !== null}
      userId={user?.id ?? ""}
      workspaceId={currentWorkspace === "personal" ? null : currentWorkspace}
      sessionId={draftSessionId}
    />
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

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
              <Link
                to="/prompts/wizard"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Wand2 className="h-4 w-4" />
                Kickstart Template
              </Link>

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
                      <SheetTitle>Prompt Coach</SheetTitle>
                    </SheetHeader>
                    <div className="h-full">{coachPanel}</div>
                  </SheetContent>
                </Sheet>
              )}

              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Create Prompt
              </Button>
            </div>
          </div>

          {/* Main Studio Layout */}
          <div className="flex gap-6">
            {/* Left: Editor */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h1 className="mb-6 text-xl font-semibold text-foreground">
                  Create New Prompt
                </h1>

                <div className="space-y-6">
                  {/* Prompt Content with line numbers */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Prompt Content *</Label>
                    <div className="rounded-md border border-input bg-background overflow-hidden">
                      {renderLineNumberedEditor()}
                    </div>
                    {errors.content && (
                      <p className="text-sm text-destructive">{errors.content}</p>
                    )}
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

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your prompt a clear, descriptive title"
                      className={errors.title ? "border-destructive" : ""}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Description *</Label>
                    <Textarea
                      id="shortDescription"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Briefly describe what this prompt does"
                      rows={2}
                      className={errors.shortDescription ? "border-destructive" : ""}
                    />
                    {errors.shortDescription && (
                      <p className="text-sm text-destructive">{errors.shortDescription}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {shortDescription.length}/2000 characters
                    </p>
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
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category}</p>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add tags and press Enter"
                        disabled={tags.length >= 10}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddTag}
                        disabled={!tagInput.trim() || tags.length >= 10}
                      >
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 rounded-full p-0.5 hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {tags.length}/10 tags
                    </p>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor="visibility" className="text-base">
                        Make this prompt public
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isPublic
                          ? "Anyone can discover and use this prompt"
                          : "Only you can see this prompt"}
                      </p>
                    </div>
                    <Switch
                      id="visibility"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                  </div>

                  {/* Bottom Create Button */}
                  <Button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Create Prompt
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
