import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, X, ArrowLeft, Trash2, Save, Plus, ListTree, History } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import type { PromptKit } from "@/types/promptKit";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";
import { parsePromptKitItems } from "@/lib/promptKitParser";
import { PromptKitSlugEditor } from "@/components/promptKits/PromptKitSlugEditor";
import { PromptKitVersionHistoryPanel } from "@/components/promptKits/PromptKitVersionHistoryPanel";

interface KitFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  language: string;
}

export default function PromptKitEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kit, setKit] = useState<PromptKit | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string>("");

  const [formData, setFormData] = useState<KitFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    tags: [],
    isPublic: false,
    language: DEFAULT_LANGUAGE,
  });
  const [tagInput, setTagInput] = useState("");

  const kitId = kit?.id;
  const items = parsePromptKitItems(formData.content);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/prompt-kits/${slug}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, slug]);

  useEffect(() => {
    async function fetchKit() {
      if (!slug || !user) return;
      try {
        const { data, error } = await (supabase.from("prompt_kits") as any)
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error || !data) {
          toast.error("Prompt kit not found");
          navigate("/library");
          return;
        }
        if (data.author_id !== user.id) {
          toast.error("You don't have permission to edit this kit");
          navigate("/library");
          return;
        }
        setKit(data);
        setCurrentSlug(data.slug);
        setFormData({
          title: data.title,
          description: data.description || "",
          content: data.content || "",
          category: data.category || "",
          tags: data.tags || [],
          isPublic: data.published ?? false,
          language: data.language || DEFAULT_LANGUAGE,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load prompt kit");
        navigate("/library");
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchKit();
  }, [slug, user, navigate]);

  const normalizeTag = (tag: string) =>
    tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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

  const handleRemoveTag = (t: string) =>
    setFormData({ ...formData, tags: formData.tags.filter((x) => x !== t) });

  const handleAddPrompt = () => {
    setFormData((f) => ({
      ...f,
      content: `${f.content.replace(/\s+$/, "")}\n\n## Prompt: Untitled\n\n`,
    }));
  };

  const handleSave = async () => {
    if (!user || !kitId || !kit) return;
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    if (!formData.content.trim()) { toast.error("Content is required"); return; }

    setIsSubmitting(true);
    try {
      // Snapshot previous state into prompt_kit_versions before overwriting
      const contentChanged =
        kit.title !== formData.title.trim() ||
        (kit.description || "") !== formData.description.trim() ||
        (kit.content || "") !== formData.content.trim() ||
        JSON.stringify(kit.tags || []) !== JSON.stringify(formData.tags);

      if (contentChanged) {
        const { data: latest } = await (supabase.from("prompt_kit_versions") as any)
          .select("version_number")
          .eq("prompt_kit_id", kitId)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextVersion = (latest?.version_number ?? 0) + 1;
        await (supabase.from("prompt_kit_versions") as any).insert({
          prompt_kit_id: kitId,
          version_number: nextVersion,
          title: kit.title,
          description: kit.description,
          content: kit.content,
          tags: kit.tags,
          change_notes: null,
        });
      }

      const { error } = await (supabase.from("prompt_kits") as any)
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content: formData.content.trim(),
          category: formData.category || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          published: formData.isPublic,
          language: formData.language,
        })
        .eq("id", kitId);
      if (error) { toast.error("Failed to save prompt kit"); return; }

      // Refresh local kit state to reflect saved values for next diff
      setKit({
        ...kit,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        content: formData.content.trim(),
        category: formData.category || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        published: formData.isPublic,
        language: formData.language,
      });

      toast.success("Changes saved!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!kitId) return;
    setIsDeleting(true);
    try {
      const { error } = await (supabase.from("prompt_kits") as any).delete().eq("id", kitId);
      if (error) throw error;
      toast.success("Prompt kit deleted");
      navigate("/library");
    } catch {
      toast.error("Failed to delete prompt kit");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || !kit) return null;

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
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this prompt kit?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your prompt kit.
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

          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <div className="rounded-xl border border-border bg-card p-6">
                <h1 className="mb-6 text-xl font-semibold text-foreground">Edit Prompt Kit</h1>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Kit Content (Markdown) *</Label>
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
                      Separate items with <code className="font-mono">## Prompt: Your title</code>.
                    </p>
                    <LineNumberedEditor
                      id="content"
                      value={formData.content}
                      onChange={(v) => setFormData({ ...formData, content: v })}
                      placeholder="## Prompt: Title&#10;&#10;Prompt body…"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Press Enter to add tags…" />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((t) => (
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

                  <LanguageSelect value={formData.language} onChange={(v) => setFormData({ ...formData, language: v })} />

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor="visibility" className="text-base">Make this kit public</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.isPublic ? "Anyone can discover and use this kit" : "Only you can see this kit"}
                      </p>
                    </div>
                    <Switch
                      id="visibility"
                      checked={formData.isPublic}
                      onCheckedChange={(v) => setFormData({ ...formData, isPublic: v })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-[280px] shrink-0 sticky top-24 self-start">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <ListTree className="h-4 w-4 text-primary" />
                  Outline
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No prompts detected yet.
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
