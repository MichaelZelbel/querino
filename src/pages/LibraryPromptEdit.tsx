import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "@/lib/router-compat";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LineNumberedEditor } from "@/components/editors/LineNumberedEditor";
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
  Bot,
  Info,
} from "lucide-react";
import { VersionHistoryPanel } from "@/components/versions";
import { toast } from "sonner";
import { moderateContent, type ModerationResult } from "@/lib/moderateContent";
import { ModerationBlockDialog } from "@/components/moderation/ModerationBlockDialog";
import type { Prompt } from "@/types/prompt";
import { categoryOptions } from "@/types/prompt";
import { format } from "date-fns";
import { PublishPromptModal } from "@/components/prompts/PublishPromptModal";

import {
  DownloadMarkdownButton,
  ImportMarkdownButton,
} from "@/components/markdown";
import type { ParsedMarkdown } from "@/lib/markdown";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";
import { PromptCoachPanel } from "@/components/studio/PromptCoachPanel";
import { SlugEditor } from "@/components/prompts/SlugEditor";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import { deterministicSessionId } from "@/lib/runCanvasAI";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { SaveStateBadge } from "@/components/editors/SaveStateBadge";
import { invalidateArtifactQueries } from "@/lib/invalidateArtifactQueries";
import { userCanEditArtifact } from "@/hooks/useCanEditArtifact";

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
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const isMobile = useIsMobile();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Set synchronously before moderation, so a second click or Ctrl+S during
  // the moderation call (which takes seconds) cannot start a second write.
  const busyRef = useRef(false);
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
  // Read by Undo, so a toast's Undo sees the content from apply time.
  const previousContentRef = useRef<string | null>(null);

  // AI coach panel state (mobile sheet)
  const [showCoachSheet, setShowCoachSheet] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  // prompt_versions is author-only under RLS, so team editors and admins get
  // the editor without the version features they could not use.
  const isArtifactAuthor = !!user && prompt?.author_id === user.id;
  const [moderationBlock, setModerationBlock] =
    useState<ModerationResult | null>(null);

  // Get the prompt ID for database operations
  const promptId = prompt?.id;

  const currentForm = {
    title,
    shortDescription,
    content,
    category,
    tags,
    isPublic,
    language,
  };
  type PromptForm = typeof currentForm;

  const { isDirty, savedAt, markSaved, allowNavigationTo } = useUnsavedChanges({
    data: currentForm,
    isSaving: isSaving || isSavingVersion || isPublishing,
    onSave: () => handleSaveChanges(),
  });

  // The last form known to match the database. Unpublish writes only the
  // visibility, so its new baseline is this one with isPublic flipped, and any
  // unsaved edits stay unsaved.
  const savedFormRef = useRef<PromptForm | null>(null);
  const markFormSaved = (form: PromptForm) => {
    savedFormRef.current = form;
    markSaved(form);
  };

  // Put a loaded row into the form and take it as the clean baseline. The
  // baseline is passed explicitly because markSaved() with no argument reads
  // the state of the current render, which is still the previous form.
  const applyPromptToForm = (loaded: Prompt) => {
    const form = {
      title: loaded.title,
      shortDescription: loaded.description,
      content: loaded.content,
      category: loaded.category,
      tags: loaded.tags || [],
      isPublic: loaded.is_public,
      language: loaded.language || DEFAULT_LANGUAGE,
    };
    setTitle(form.title);
    setShortDescription(form.shortDescription);
    setContent(form.content);
    setCategory(form.category);
    setTags(form.tags);
    setIsPublic(form.isPublic);
    setLanguage(form.language);
    markFormSaved(form);
  };

  // slug|user of the prompt already in the form. A new user object for the
  // same person (token refresh, tab focus) or the role query settling must
  // not load the row again over unsaved edits.
  const loadedKeyRef = useRef<string | null>(null);

  // The slug the slug editor just assigned. Changing the slug navigates to the
  // new edit URL, and the fetch effect below is keyed on the slug, so without
  // this it reloaded every field and threw away unsaved edits.
  const assignedSlugRef = useRef<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/library/${slug}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, slug]);

  // Fetch prompt and versions
  useEffect(() => {
    async function fetchData() {
      // The admin role arrives from an async query. Deciding before it lands showed an
      // admin "Not Authorized" on every reload of someone else's prompt.
      if (!slug || !userId || roleLoading) return;
      if (loadedKeyRef.current === `${slug}|${userId}`) return;

      // The prompt behind this slug is already loaded: it is the one whose slug
      // was just renamed. Refetching would overwrite unsaved edits.
      if (assignedSlugRef.current === slug) {
        assignedSlugRef.current = null;
        loadedKeyRef.current = `${slug}|${userId}`;
        return;
      }

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

        if (!isAdmin && !(await userCanEditArtifact(promptData, userId))) {
          setNotAuthorized(true);
          return;
        }

        const typedPrompt = promptData as Prompt;
        setPrompt(typedPrompt);
        applyPromptToForm(typedPrompt);
        loadedKeyRef.current = `${slug}|${userId}`;

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

    if (userId && !roleLoading) {
      fetchData();
    }
    // Keyed on the user's id, not the user object: a token refresh hands out
    // a new object and reloading then wiped every unsaved edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, userId, isAdmin, roleLoading]);

  // Reload the prompt + versions after a restore from the version panel.
  const handleRestoreComplete = async () => {
    if (!promptId) return;

    const { data: promptData } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", promptId)
      .maybeSingle();

    if (promptData) {
      const typedPrompt = promptData as Prompt;
      setPrompt(typedPrompt);
      applyPromptToForm(typedPrompt);
    }

    const { data: versionsData } = await supabase
      .from("prompt_versions")
      .select("*")
      .eq("prompt_id", promptId)
      .order("version_number", { ascending: false });

    if (versionsData) {
      setVersions(versionsData as PromptVersion[]);
    }
  };

  const normalizeTag = (tag: string): string => {
    return tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
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
        const matchedCategory = categoryOptions.find(
          (cat) => cat.id.toLowerCase() === result.category.toLowerCase(),
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
      newErrors.shortDescription =
        "Description must be less than 2000 characters";
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

  // Runs the public-content check for a form that is or is about to be public.
  // Returns false (and shows the block dialog) when it is refused.
  const passesModeration = async (
    form: PromptForm,
    action: "publish" | "edit_public",
    extra: Record<string, string | null | undefined> = {},
  ): Promise<boolean> => {
    if (!promptId) return false;
    const result = await moderateContent(
      {
        title: form.title,
        description: form.shortDescription,
        content: form.content,
        ...extra,
      },
      action,
      "prompt",
      promptId,
    );
    if (!result.approved) {
      setModerationBlock(result);
      return false;
    }
    return true;
  };

  const handleSaveChanges = async () => {
    if (busyRef.current || !validate() || !promptId || !user) return;

    // The form as submitted: this is what gets marked saved, so text typed
    // while the request is in flight stays dirty.
    const submitted = currentForm;
    busyRef.current = true;
    setIsSaving(true);
    try {
      if (
        submitted.isPublic &&
        !(await passesModeration(submitted, "edit_public"))
      ) {
        return;
      }

      // No author_id filter: an admin is allowed in here too, and row-level security is
      // what decides. The returned rows are checked because PostgREST reports no error
      // when a write matches nothing, which used to show "saved" after saving nothing.
      const { data, error } = await supabase
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
        .select("id");

      if (error) {
        console.error("Error updating prompt:", error);
        toast.error("Failed to save changes. Please try again.");
        return;
      }

      if (!data || data.length === 0) {
        toast.error(
          "Nothing was saved. You may not have access to this prompt.",
        );
        return;
      }

      markFormSaved(submitted);
      void invalidateArtifactQueries(queryClient, "prompt");
      toast.success("Changes saved successfully!");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (
      busyRef.current ||
      !validate() ||
      !promptId ||
      !user ||
      !isArtifactAuthor
    )
      return;

    const submitted = currentForm;
    busyRef.current = true;
    setIsSavingVersion(true);
    try {
      // The same check as an ordinary save: a new version of a public prompt
      // is public content too.
      if (
        submitted.isPublic &&
        !(await passesModeration(submitted, "edit_public"))
      ) {
        return;
      }

      const nextVersionNumber =
        versions.length > 0 ? versions[0].version_number + 1 : 1;

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

      // Same write as the ordinary save, so it carries language too. Leaving it out made
      // a new version quietly revert the language back to whatever was stored.
      const { data: updated, error: updateError } = await supabase
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
        .select("id");

      if (updateError) {
        console.error("Error updating prompt:", updateError);
        toast.error("Version created but failed to update prompt.");
        return;
      }

      if (!updated || updated.length === 0) {
        toast.error(
          "Version created but the prompt was not updated. You may not have access to it.",
        );
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
      markFormSaved(submitted);
      void invalidateArtifactQueries(queryClient, "prompt");
      toast.success(`Version ${nextVersionNumber} created successfully!`);
    } catch (err) {
      console.error("Error creating version:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      busyRef.current = false;
      setIsSavingVersion(false);
    }
  };

  const handleDelete = async () => {
    if (!promptId || !user) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", promptId)
        .select("id");

      if (error) {
        console.error("Error deleting prompt:", error);
        toast.error("Failed to delete prompt. Please try again.");
        return;
      }

      if (!data || data.length === 0) {
        toast.error(
          "Nothing was deleted. You may not have access to this prompt.",
        );
        return;
      }

      // The row is gone: nothing left to warn about on the way out.
      markSaved();
      void invalidateArtifactQueries(queryClient, "prompt");
      toast.success("Prompt deleted successfully!");
      navigate("/library");
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (data: {
    summary: string;
    exampleOutput: string;
  }) => {
    if (busyRef.current || !promptId || !user) return;
    // Publishing saves the form too. It used to write only the visibility and
    // the summary, so the edits in the form never reached the public page.
    if (!validate()) {
      setShowPublishModal(false);
      toast.error("Fix the highlighted fields before publishing.");
      return;
    }

    const submitted: PromptForm = { ...currentForm, isPublic: true };
    busyRef.current = true;
    setIsPublishing(true);
    try {
      if (
        !(await passesModeration(submitted, "publish", {
          summary: data.summary,
          example_output: data.exampleOutput,
        }))
      ) {
        setShowPublishModal(false);
        return;
      }

      const { data: published, error } = await supabase
        .from("prompts")
        .update({
          title: submitted.title.trim(),
          description: submitted.shortDescription.trim(),
          content: submitted.content.trim(),
          category: submitted.category,
          tags: submitted.tags.length > 0 ? submitted.tags : null,
          language: submitted.language,
          is_public: true,
          published_at: new Date().toISOString(),
          summary: data.summary,
          example_output: data.exampleOutput || null,
        })
        .eq("id", promptId)
        .select("id");

      if (error) {
        console.error("Error publishing prompt:", error);
        toast.error("Failed to publish prompt. Please try again.");
        return;
      }

      if (!published || published.length === 0) {
        toast.error(
          "Nothing was published. You may not have access to this prompt.",
        );
        return;
      }

      setPrompt((prev) =>
        prev
          ? {
              ...prev,
              is_public: true,
              published_at: new Date().toISOString(),
              summary: data.summary,
              example_output: data.exampleOutput || null,
            }
          : null,
      );
      // Render the new visibility before taking the baseline, so the guard
      // compares against the form as it now is: only text typed during the
      // publish still counts as unsaved.
      flushSync(() => setIsPublic(true));
      markFormSaved(submitted);
      void invalidateArtifactQueries(queryClient, "prompt");
      setShowPublishModal(false);
      toast.success("Prompt published successfully!");
      navigate(`/prompts/${slug}`);
    } catch (err) {
      console.error("Error publishing:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      busyRef.current = false;
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (busyRef.current || !promptId || !user) return;

    busyRef.current = true;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("prompts")
        .update({
          is_public: false,
        })
        .eq("id", promptId)
        .select("id");

      if (error) {
        console.error("Error unpublishing prompt:", error);
        toast.error("Failed to unpublish prompt. Please try again.");
        return;
      }

      if (!data || data.length === 0) {
        toast.error(
          "Nothing was unpublished. You may not have access to this prompt.",
        );
        return;
      }

      setPrompt((prev) => (prev ? { ...prev, is_public: false } : null));
      setIsPublic(false);
      // Only the visibility was written: the stored baseline flips with it and
      // any other unsaved edit stays unsaved.
      markFormSaved({
        ...(savedFormRef.current ?? currentForm),
        isPublic: false,
      });
      void invalidateArtifactQueries(queryClient, "prompt");
      toast.success("Prompt unpublished. It's now private.");
    } catch (err) {
      console.error("Error unpublishing:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  };

  // AI Coach: apply content to the editor only. Versions are created on
  // explicit save — per-apply inserts spammed history with drafts ahead of
  // the live prompt and raced on version numbers.
  const handleApplyAIContent = (newContent: string) => {
    // The coach calls the handler from the latest render, so `content` is the
    // editor text at apply time, including anything typed during the request.
    previousContentRef.current = content;
    setPreviousContent(content);
    setContent(newContent);
  };

  // AI Coach: undo last AI edit
  const handleUndoAI = () => {
    const restore = previousContentRef.current;
    if (restore === null) return;
    previousContentRef.current = null;
    setContent(restore);
    setPreviousContent(null);
    toast.success("AI edit undone.");
  };

  // Coach panel element (reused for desktop + mobile sheet)
  const workspaceScope = currentWorkspace ?? "personal";
  const coachSessionId =
    promptId && user
      ? deterministicSessionId(workspaceScope, user.id, promptId)
      : "draft";

  const coachPanel = promptId ? (
    <PromptCoachPanel
      artifactId={promptId}
      canvasContent={content}
      onApplyContent={handleApplyAIContent}
      onUndo={handleUndoAI}
      canUndo={previousContent !== null}
      userId={user?.id ?? ""}
      workspaceId={currentWorkspace === "personal" ? null : currentWorkspace}
      sessionId={coachSessionId}
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
                  setShortDescription(
                    parsed.frontmatter.description || shortDescription,
                  );
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

              {isArtifactAuthor && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowVersionPanel(true)}
                >
                  <History className="h-4 w-4" />
                  Version History
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowVersionDrawer(true)}
                aria-label="Prompt details"
                title="Prompt details"
              >
                <Info className="h-4 w-4" />
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

              <SaveStateBadge
                isDirty={isDirty}
                isSaving={isSaving}
                savedAt={savedAt}
                className="mr-1"
              />
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving || isSavingVersion}
                className="gap-2"
                title="Save (⌘S / Ctrl+S)"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>

              {isArtifactAuthor && (
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
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={isDeleting}
                    aria-label="Delete prompt"
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
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <p>
                          This action cannot be undone. Deleting this prompt
                          will also remove:
                        </p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          <li>All saved versions and version history</li>
                          <li>All comments, reviews and ratings</li>
                          <li>Any edit suggestions submitted by others</li>
                          <li>References from collections it belongs to</li>
                          <li>
                            Synced copies in connected GitHub repositories and
                            Menerio
                          </li>
                        </ul>
                      </div>
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
                        <LineNumberedEditor
                          id="content"
                          value={content}
                          onChange={setContent}
                          placeholder="Write your prompt here..."
                          error={!!errors.content}
                        />
                        {errors.content && (
                          <p className="text-sm text-destructive">
                            {errors.content}
                          </p>
                        )}
                      </div>

                      {/* AI Metadata Suggestion */}
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSuggestMetadata}
                          disabled={isGeneratingMetadata || !content.trim()}
                          className="gap-1.5"
                        >
                          {isGeneratingMetadata ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Generating…
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Suggest title, description, category & tags
                            </>
                          )}
                        </Button>

                        {metadataError && (
                          <p className="text-sm text-destructive">
                            {metadataError}
                          </p>
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
                          <p className="text-sm text-destructive">
                            {errors.title}
                          </p>
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
                          className={
                            errors.shortDescription ? "border-destructive" : ""
                          }
                        />
                        {errors.shortDescription && (
                          <p className="text-sm text-destructive">
                            {errors.shortDescription}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {shortDescription.length}/2000 characters
                        </p>
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger
                            className={
                              errors.category ? "border-destructive" : ""
                            }
                          >
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
                          <p className="text-sm text-destructive">
                            {errors.category}
                          </p>
                        )}
                      </div>

                      {/* Language */}
                      <LanguageSelect value={language} onChange={setLanguage} />

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
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  aria-label={`Remove tag ${tag}`}
                                  className="-my-1 ml-0.5 rounded-full p-1.5 hover:bg-muted"
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

                      {/* Slug Editor */}
                      {prompt &&
                        user &&
                        (prompt.author_id === user.id || isAdmin) && (
                          <SlugEditor
                            promptId={prompt.id}
                            currentSlug={prompt.slug}
                            onSlugChanged={(newSlug) => {
                              assignedSlugRef.current = newSlug;
                              setPrompt((prev) =>
                                prev ? { ...prev, slug: newSlug } : null,
                              );
                              // Router navigation, not history.replaceState: the raw
                              // history call left the router's slug param on the old
                              // value, so "View Public Page" kept opening the old slug.
                              // Same prompt, same editor, new URL: the unsaved
                              // edits come along, so the leave-page confirm
                              // must not fire.
                              void invalidateArtifactQueries(
                                queryClient,
                                "prompt",
                              );
                              allowNavigationTo(`/library/${newSlug}/edit`);
                              navigate(`/library/${newSlug}/edit`, {
                                replace: true,
                              });
                            }}
                          />
                        )}

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
                      {isArtifactAuthor && (
                        <div className="space-y-2">
                          <Label htmlFor="changeNotes">
                            Change Notes (for new version)
                          </Label>
                          <Textarea
                            id="changeNotes"
                            value={changeNotes}
                            onChange={(e) => setChangeNotes(e.target.value)}
                            placeholder="Optional: Describe what changed in this version"
                            rows={2}
                          />
                          <p className="text-xs text-muted-foreground">
                            These notes will be saved when you click "Save as
                            New Version"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: AI Coach Panel (desktop only) */}
            {!isMobile && (
              <div
                className="w-[380px] shrink-0 sticky top-24 self-start"
                style={{ height: "calc(100vh - 12rem)" }}
              >
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

      {/* Full version manager (view / compare / restore) */}
      {promptId && isArtifactAuthor && (
        <VersionHistoryPanel
          open={showVersionPanel}
          onOpenChange={setShowVersionPanel}
          promptId={promptId}
          currentPrompt={{
            id: promptId,
            title,
            description: shortDescription,
            content,
            tags: tags.length > 0 ? tags : null,
          }}
          onRestoreComplete={handleRestoreComplete}
        />
      )}

      {/* Details Drawer */}
      <Sheet open={showVersionDrawer} onOpenChange={setShowVersionDrawer}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Prompt Details
            </SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="details" className="h-[calc(100vh-80px)]">
            <TabsContent value="details" className="mt-0">
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Created
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {prompt?.created_at
                        ? format(
                            new Date(prompt.created_at),
                            "MMM d, yyyy 'at' h:mm a",
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Last Updated
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {prompt?.updated_at
                        ? format(
                            new Date(prompt.updated_at),
                            "MMM d, yyyy 'at' h:mm a",
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Version Count
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {versions.length} version
                      {versions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Visibility
                    </p>
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

      <ModerationBlockDialog
        open={!!moderationBlock}
        onClose={() => setModerationBlock(null)}
        category={moderationBlock?.category}
        supportHint={moderationBlock?.support_hint}
      />
    </div>
  );
}
