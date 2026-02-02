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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, X, ArrowLeft, Trash2, Save, Grab } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import type { Claw } from "@/types/claw";
import { DownloadMarkdownButton, ImportMarkdownButton } from "@/components/markdown";
import type { ParsedMarkdown } from "@/lib/markdown";

export default function ClawEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claw, setClaw] = useState<Claw | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", content: "", category: "", tags: [] as string[], isPublic: false });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate(`/auth?redirect=/claws/${slug}/edit`, { replace: true });
  }, [user, authLoading, navigate, slug]);

  useEffect(() => {
    async function fetchClaw() {
      if (!slug || !user) return;
      try {
        const { data, error } = await (supabase.from("claws") as any).select("*").eq("slug", slug).maybeSingle();
        if (error || !data) { toast.error("Claw not found"); navigate("/library"); return; }
        if (data.author_id !== user.id) { toast.error("You don't have permission to edit this claw"); navigate("/library"); return; }
        setClaw(data);
        setFormData({ title: data.title, description: data.description || "", content: data.content || "", category: data.category || "", tags: data.tags || [], isPublic: data.published ?? false });
      } catch { toast.error("Failed to load claw"); navigate("/library"); } finally { setLoading(false); }
    }
    if (user) fetchClaw();
  }, [slug, user, navigate]);

  const normalizeTag = (tag: string) => tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const normalized = normalizeTag(tagInput);
      if (normalized && !formData.tags.includes(normalized)) setFormData({ ...formData, tags: [...formData.tags, normalized] });
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagToRemove: string) => setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tagToRemove) });

  const handleSaveChanges = async () => {
    if (!user || !claw?.id) return;
    if (!formData.title.trim() || !formData.content.trim()) { toast.error("Title and content are required"); return; }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from("claws") as any).update({
        title: formData.title.trim(), description: formData.description.trim() || null, content: formData.content.trim(),
        category: formData.category || null, tags: formData.tags.length > 0 ? formData.tags : null, published: formData.isPublic,
      }).eq("id", claw.id);
      if (error) { toast.error("Failed to update claw"); return; }
      toast.success("Changes saved!");
    } catch { toast.error("Something went wrong"); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!claw?.id) return;
    setIsDeleting(true);
    try {
      const { error } = await (supabase.from("claws") as any).delete().eq("id", claw.id);
      if (error) throw error;
      toast.success("Claw deleted");
      navigate("/library");
    } catch { toast.error("Failed to delete claw"); } finally { setIsDeleting(false); }
  };

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !claw) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/library" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" />Back to Library</Link>
            <div className="flex items-center gap-2 flex-wrap">
              <ImportMarkdownButton
                type="claw"
                size="sm"
                variant="outline"
                label="Import .md"
                isEditorMode
                onImport={(parsed: ParsedMarkdown) => {
                  setFormData({
                    ...formData,
                    title: parsed.frontmatter.title || formData.title,
                    description: parsed.frontmatter.description || formData.description,
                    content: parsed.content,
                    tags: parsed.frontmatter.tags || formData.tags,
                  });
                }}
              />
              <DownloadMarkdownButton
                title={formData.title}
                type="claw"
                description={formData.description}
                tags={formData.tags}
                content={formData.content}
                size="sm"
                variant="outline"
              />
              <Button onClick={handleSaveChanges} disabled={isSubmitting} className="gap-2 bg-amber-500 hover:bg-amber-600">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="icon" disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete this claw?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4"><Grab className="h-5 w-5 text-amber-500" /><h1 className="text-xl font-semibold">Edit Claw</h1></div>
            <div className="space-y-2"><Label htmlFor="content">Claw Definition *</Label><Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={14} className="font-mono text-sm" /></div>
            <div className="space-y-2"><Label htmlFor="title">Title *</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categoryOptions.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Tags</Label><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Press Enter to add tags..." />{formData.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{formData.tags.map((tag) => <Badge key={tag} variant="secondary" className="gap-1">{tag}<button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button></Badge>)}</div>}</div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4"><div><Label className="text-base">Make this claw public</Label><p className="text-sm text-muted-foreground">{formData.isPublic ? "Anyone can discover this claw" : "Only you can see this claw"}</p></div><Switch checked={formData.isPublic} onCheckedChange={(v) => setFormData({ ...formData, isPublic: v })} /></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
