import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Save,
  GitBranch,
  Trash2,
  X,
  Calendar,
  Clock,
  Layers,
  History,
  Globe,
  Eye,
  Sparkles,
  Lock,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import type { Prompt } from "@/types/prompt";
import { categoryOptions } from "@/types/prompt";
import { format } from "date-fns";
import { PublishPromptModal } from "@/components/prompts/PublishPromptModal";

import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { DownloadMarkdownButton, ImportMarkdownButton } from "@/components/markdown";
import type { ParsedMarkdown } from "@/lib/markdown";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";
import { PromptCoachPanel } from "@/components/studio/PromptCoachPanel";
import { useIsMobile } from "@/hooks/use-mobile";

interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
  change_notes: string | null;
  created_at: string;
}

export default function LibraryPromptEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isPremium } = usePremiumCheck();
  const isMobile = useIsMobile();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  const [showVersionDrawer, setShowVersionDrawer] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [changeNotes, setChangeNotes] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // AI metadata suggestion state
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Undo state for AI edits
  const [previousContent, setPreviousContent] = useState<string | null>(null);

  // AI coach panel state (mobile sheet)
  const [showCoachSheet, setShowCoachSheet] = useState(false);

  // Get the prompt ID for database operations
  const promptId = prompt?.id;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/library/${slug}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, slug]);

  // Fetch prompt and versions
  useEffect(() => {
    async function fetchData() {
      if (!slug || !user) return;

      try {
        const { data: promptData, error: promptError } = await supabase
          .from("prompts")
          .select("*")
          .eq("slug", slug)
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

        const typedPrompt = promptData as Prompt;
        setPrompt(typedPrompt);
        setTitle(typedPrompt.title);
        setShortDescription(typedPrompt.description);
        setContent(typedPrompt.content);
        setCategory(typedPrompt.category);
        setTags(typedPrompt.tags || []);
        setIsPublic(typedPrompt.is_public);
        setLanguage(typedPrompt.language || DEFAULT_LANGUAGE);

        const { data: versionsData, error: versionsError } = await supabase
          .from("prompt_versions")
          .select("*")
          .eq("prompt_id", promptData.id)
          .order("version_number", { ascending: false });

        if (!versionsError && versionsData) {
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
  }, [slug, user]);

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

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.title) setTitle(result.title);
      if (result.description) setShortDescription(result.description);
      
      if (result.category) {
        const matchedCategory = categoryOptions.find(cat => 
          cat.id.toLowerCase() === result.category.toLowerCase()
        );
        if (matchedCategory) setCategory(matchedCategory.id);
      }
      
      if (result.tags && Array.isArray(result.tags)) {
        const newTags = result.tags
          .map((tag: string) => normalizeTag(tag))
          .filter((tag: string) => tag)
          .slice(0, 10);
        setTags(newTags);
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

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!shortDescription.trim()) {
      newErrors.shortDescription = "Short description is required";
    } else if (shortDescription.length > 2000) {
      newErrors.shortDescription = "Description must be less than 2000 characters";
    }

    if (!content.trim()) {
      newErrors.content = "Prompt content is required";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validate() || !promptId || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          title: title.trim(),
          description: shortDescription.trim(),
          content: content.trim(),
          category,
          tags: tags.length > 0 ? tags : null,
          is_public: isPublic,
          language,
        })
        .eq("id", promptId)
        .eq("author_id", user.id);

      if (error) {
        console.error("Error updating prompt:", error);
        toast.error("Failed to save changes. Please try again.");
        return;
      }

      toast.success("Changes saved successfully!");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!validate() || !promptId || !user) return;

    setIsSavingVersion(true);
    try {
      const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;

      const { error: versionError } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: promptId,
          version_number: nextVersionNumber,
          title: title.trim(),
          description: shortDescription.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : null,
          change_notes: changeNotes.trim() || null,
        });

      if (versionError) {
        console.error("Error creating version:", versionError);
        toast.error("Failed to create new version. Please try again.");
        return;
      }

      const { error: updateError } = await supabase
        .from("prompts")
        .update({
          title: title.trim(),
          description: shortDescription.trim(),
          content: content.trim(),
          category,
          tags: tags.length > 0 ? tags : null,
          is_public: isPublic,
        })
        .eq("id", promptId)
        .eq("author_id", user.id);

      if (updateError) {
        console.error("Error updating prompt:", updateError);
        toast.error("Version created but failed to update prompt.");
        return;
      }

      const { data: newVersions } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", promptId)
        .order("version_number", { ascending: false });

      if (newVersions) {
        setVersions(newVersions as PromptVersion[]);
      }

      setChangeNotes("");
      toast.success(`Version ${nextVersionNumber} created successfully!`);
    } catch (err) {
      console.error("Error creating version:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleDelete = async () => {
    if (!promptId || !user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", promptId)
        .eq("author_id", user.id);

      if (error) {
        console.error("Error deleting prompt:", error);
        toast.error("Failed to delete prompt. Please try again.");
        return;
      }

      toast.success("Prompt deleted successfully!");
      navigate("/library");
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (data: { summary: string; exampleOutput: string }) => {
    if (!promptId || !user) return;

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          is_public: true,
          published_at: new Date().toISOString(),
          summary: data.summary,
          example_output: data.exampleOutput || null,
        })
        .eq("id", promptId)
        .eq("author_id", user.id);

      if (error) {
        console.error("Error publishing prompt:", error);
        toast.error("Failed to publish prompt. Please try again.");
        return;
      }

      setPrompt((prev) => prev ? {
        ...prev,
        is_public: true,
        published_at: new Date().toISOString(),
        summary: data.summary,
        example_output: data.exampleOutput || null,
      } : null);
      setIsPublic(true);
      setShowPublishModal(false);
      toast.success("Prompt published successfully!");
      navigate(`/prompts/${slug}`);
    } catch (err) {
      console.error("Error publishing:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!promptId || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          is_public: false,
        })
        .eq("id", promptId)
        .eq("author_id", user.id);

      if (error) {
        console.error("Error unpublishing prompt:", error);
        toast.error("Failed to unpublish prompt. Please try again.");
        return;
      }

      setPrompt((prev) => prev ? { ...prev, is_public: false } : null);
      setIsPublic(false);
      toast.success("Prompt unpublished. It's now private.");
    } catch (err) {
      console.error("Error unpublishing:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // AI Coach: apply content from AI
  const handleApplyAIContent = async (newContent: string, changeNote?: string) => {
    setPreviousContent(content);
    setContent(newContent);

    // Auto-create version snapshot
    if (promptId && user) {
      const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
      const { error } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: promptId,
          version_number: nextVersionNumber,
          title: title.trim(),
          description: shortDescription.trim(),
          content: newContent,
          tags: tags.length > 0 ? tags : null,
          change_notes: changeNote || "AI-assisted edit",
        });

      if (!error) {
        const { data: newVersions } = await supabase
          .from("prompt_versions")
          .select("*")
          .eq("prompt_id", promptId)
          .order("version_number", { ascending: false });

        if (newVersions) {
          setVersions(newVersions as PromptVersion[]);
        }
      }
    }
  };

  // AI Coach: undo last AI edit
  const handleUndoAI = () => {
    if (previousContent !== null) {
      setContent(previousContent);
      setPreviousContent(null);
      toast.success("AI edit undone.");
    }
  };

  // Render the content area with line numbers
  const renderLineNumberedEditor = () => {
    const lines = content.split("\n");
    const lineCount = lines.length;

    return (
      <div className="relative">
        <div className="flex">
          {/* Line numbers */}
          <div
            className="select-none pr-3 pt-2 pb-2 text-right font-mono text-xs text-muted-foreground/50 leading-[1.7rem] min-w-[2.5rem] border-r border-border mr-0"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
          {/* Editor */}
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

  // Coach panel element (reused for desktop + mobile sheet)
  const coachPanel = promptId ? (
    <PromptCoachPanel
      artifactId={promptId}
      canvasContent={content}
      onApplyContent={handleApplyAIContent}
      onUndo={handleUndoAI}
      canUndo={previousContent !== null}
    />
  ) : null;

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
              You don't have permission to edit this prompt.
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
                type="prompt"
                size="sm"
                variant="outline"
                label="Import .md"
                isEditorMode
                onImport={(parsed: ParsedMarkdown) => {
                  setTitle(parsed.frontmatter.title || title);
                  setShortDescription(parsed.frontmatter.description || shortDescription);
                  setContent(parsed.content);
                  if (parsed.frontmatter.tags) {
                    setTags(parsed.frontmatter.tags);
                  }
                }}
              />
              <DownloadMarkdownButton
                title={title}
                type="prompt"
                description={shortDescription}
                tags={tags}
                content={content}
                size="sm"
                variant="outline"
              />

              {prompt?.is_public ? (
                <>
                  <Link to={`/prompts/${slug}`}>
                    <Button variant="outline" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View Public Page
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={handleUnpublish}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Unpublish
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowPublishModal(true)}
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Publish
                </Button>
              )}

              <Button variant="outline" className="gap-2" onClick={() => setShowVersionDrawer(true)}>
                <History className="h-4 w-4" />
                Version History
              </Button>

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
                onClick={handleSaveChanges}
                disabled={isSaving || isSavingVersion}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>

              <Button
                onClick={handleSaveAsNewVersion}
                disabled={isSaving || isSavingVersion}
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
                    <AlertDialogTitle>Delete this prompt?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your prompt and all its versions.
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
            {/* Left: Editor + Metadata */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Editor */}
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h1 className="mb-6 text-xl font-semibold text-foreground">
                      Edit Prompt
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

      {/* Publish Modal */}
      <PublishPromptModal
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />

      {/* Version History & Details Drawer */}
      <Sheet open={showVersionDrawer} onOpenChange={setShowVersionDrawer}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Version History & Details
            </SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="versions" className="h-[calc(100vh-80px)]">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent px-4 pt-2">
              <TabsTrigger value="versions" className="flex-1">Versions</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="versions" className="mt-0 h-[calc(100%-44px)]">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No versions yet. Click "Save as New Version" to create one.
                    </p>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className="rounded-lg border border-border bg-card p-4 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={version === versions[0] ? "default" : "secondary"} className="text-xs">
                            v{version.version_number}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(version.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="font-medium text-foreground mt-2 truncate">{version.title}</p>
                        {version.change_notes && (
                          <p className="text-muted-foreground mt-1 line-clamp-2 italic">
                            "{version.change_notes}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="details" className="mt-0">
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {prompt?.created_at
                        ? format(new Date(prompt.created_at), "MMM d, yyyy 'at' h:mm a")
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {prompt?.updated_at
                        ? format(new Date(prompt.updated_at), "MMM d, yyyy 'at' h:mm a")
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Version Count</p>
                    <p className="text-sm text-muted-foreground">
                      {versions.length} version{versions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Visibility</p>
                    <p className="text-sm text-muted-foreground">
                      {isPublic ? "Public" : "Private"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
