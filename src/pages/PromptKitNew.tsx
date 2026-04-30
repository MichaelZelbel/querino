import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LineNumberedEditor } from "@/components/editors/LineNumberedEditor";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft, Loader2, X, Save, Plus, ListTree, Sparkles, Bot } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { generateSlug } from "@/hooks/useGenerateSlug";
import { parsePromptKitItems } from "@/lib/promptKitParser";
import { ArtifactCoachPanel } from "@/components/studio/ArtifactCoachPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { getOrCreateDraftSessionId, promoteDraftSession } from "@/lib/runCanvasAI";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";

const DEFAULT_TEMPLATE = `## Prompt: My first prompt

Write your prompt here…
`;

export default function PromptKitNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();
  const { checkCredits } = useAICreditsGate();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  const [content, setContent] = useState(searchParams.get("content") || DEFAULT_TEMPLATE);
  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [description, setDescription] = useState(searchParams.get("description") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(searchParams.get("tags")?.split(",").filter(Boolean) || []);
  const [isPublic, setIsPublic] = useState(false);
  const [language, setLanguage] = useState(searchParams.get("language") || DEFAULT_LANGUAGE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI undo
  const [previousContent, setPreviousContent] = useState<string | null>(null);
  // Metadata suggestion
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const workspaceScope = currentWorkspace ?? "personal";
  const coachSessionId = user
    ? getOrCreateDraftSessionId(workspaceScope, user.id, "prompt_kit")
    : "draft";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/prompt-kits/new", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const items = parsePromptKitItems(content);

  const normalizeTag = (tag: string) =>
    tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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

  const handleRemoveTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleAddPrompt = () => {
    setContent((c) => `${c.replace(/\s+$/, "")}\n\n## Prompt: Untitled\n\n`);
  };

  const handleApplyAIContent = (newContent: string) => {
    setPreviousContent(content);
    setContent(newContent);
  };

  const handleUndoAI = () => {
    if (previousContent !== null) {
      setContent(previousContent);
      setPreviousContent(null);
      toast.success("Reverted last AI change");
    }
  };

  const handleSuggestMetadata = async () => {
    if (!checkCredits()) return;
    if (!content.trim()) {
      setMetadataError("Please add some kit content first.");
      return;
    }
    setIsGeneratingMetadata(true);
    setMetadataError(null);
    try {
      const { data: result, error } = await supabase.functions.invoke("suggest-promptkit-metadata", {
        body: { kit_content: content.trim(), user_id: user?.id },
      });
      if (error) throw new Error("Failed to generate suggestions");
      const data = (result as any)?.output || result;
      if (data?.title) setTitle(data.title);
      if (data?.description) setDescription(data.description);
      if (data?.category) {
        const matched = categoryOptions.find(
          (c) => c.id.toLowerCase() === String(data.category).toLowerCase(),
        );
        if (matched) setCategory(matched.id);
      }
      if (data?.tags && Array.isArray(data.tags)) {
        const newTags = data.tags
          .map((t: string) => normalizeTag(t))
          .filter(Boolean)
          .slice(0, 10);
        setTags(newTags);
      }
    } catch {
      setMetadataError("Could not generate suggestions. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!content.trim()) e.content = "Content is required";
    if (!title.trim()) e.title = "Title is required";
    if (!category) e.category = "Please select a category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!user || !validate()) return;
    setIsSubmitting(true);
    try {
      const slug = await generateSlug(title.trim());
      const { data: newKit, error } = await (supabase.from("prompt_kits") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim(),
          category,
          tags: tags.length > 0 ? tags : null,
          author_id: user.id,
          team_id: currentWorkspace !== "personal" ? currentWorkspace : null,
          published: isPublic,
          language,
          slug,
        })
        .select("id, slug")
        .single();

      if (error) {
        console.error(error);
        toast.error("Failed to create prompt kit");
        return;
      }
      toast.success("Prompt Kit created!");
      // Promote draft coach session to deterministic id keyed on the new kit
      try {
        if (user) promoteDraftSession(workspaceScope, user.id, newKit.id, "prompt_kit");
      } catch {/* ignore */}
      navigate(`/prompt-kits/${newKit.slug}`);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-[1600px] px-4">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/library" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Prompt Kit
            </Button>
          </div>

          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <div className="rounded-xl border border-border bg-card p-6">
                <h1 className="mb-6 text-xl font-semibold text-foreground">Create New Prompt Kit</h1>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">
                        Kit Content (Markdown) *
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {items.length} {items.length === 1 ? "prompt" : "prompts"} detected
                        </span>
                        <Button type="button" size="sm" variant="outline" onClick={handleAddPrompt} className="gap-1.5 h-7">
                          <Plus className="h-3.5 w-3.5" />
                          Add Prompt
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Separate items with a heading like <code className="font-mono">## Prompt: Your title</code>.
                      Everything until the next such heading is one prompt's body.
                    </p>
                    <LineNumberedEditor
                      id="content"
                      value={content}
                      onChange={setContent}
                      placeholder="## Prompt: Title&#10;&#10;Prompt body here…"
                      error={!!errors.content}
                    />
                    {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Cold Outreach Pack" className={errors.title ? "border-destructive" : ""} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe what this kit is for…" rows={2} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Press Enter to add tags…" />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((t) => (
                          <Badge key={t} variant="secondary" className="gap-1">
                            {t}
                            <button type="button" onClick={() => handleRemoveTag(t)} className="ml-1 hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <LanguageSelect value={language} onChange={setLanguage} />

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor="visibility" className="text-base">Make this kit public</Label>
                      <p className="text-sm text-muted-foreground">
                        {isPublic ? "Anyone can discover and use this kit" : "Only you can see this kit"}
                      </p>
                    </div>
                    <Switch id="visibility" checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>

                  <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2" size="lg">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Create Prompt Kit
                  </Button>
                </div>
              </div>
            </div>

            {/* Outline panel */}
            <div className="hidden lg:block w-[280px] shrink-0 sticky top-24 self-start">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <ListTree className="h-4 w-4 text-primary" />
                  Outline
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No prompts detected yet. Use a <code className="font-mono">## Prompt:</code> heading.
                  </p>
                ) : (
                  <ol className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item.index} className="text-sm">
                        <span className="text-muted-foreground mr-1.5">{item.index}.</span>
                        <span className="text-foreground">{item.title || "Untitled"}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
