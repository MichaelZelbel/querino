import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Loader2, X, Save, Send, ArrowLeft, Trash2, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { useAutosave } from "@/hooks/useAutosave";
import { AutosaveIndicator } from "@/components/editors/AutosaveIndicator";
import { DiffViewerModal } from "@/components/editors/DiffViewerModal";
import type { Skill } from "@/types/skill";

interface SkillFormData {
  title: string;
  description: string;
  content: string;
  tags: string[];
  published: boolean;
}

export default function SkillEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  
  const [formData, setFormData] = useState<SkillFormData>({
    title: "",
    description: "",
    content: "",
    tags: [],
    published: false,
  });
  const [tagInput, setTagInput] = useState("");

  // Autosave handler
  const handleAutosave = useCallback(async (data: SkillFormData) => {
    if (!user || !id) return;

    const { error } = await (supabase.from("skills") as any)
      .update({
        title: data.title.trim(),
        description: data.description.trim() || null,
        content: data.content.trim(),
        tags: data.tags.length > 0 ? data.tags : null,
        published: data.published,
      })
      .eq("id", id);

    if (error) throw error;
  }, [id, user]);

  const isOwner = skill?.author_id === user?.id;

  const { status, lastSaved, hasChanges, resetLastSaved } = useAutosave({
    data: formData,
    onSave: handleAutosave,
    delay: 2000,
    enabled: isOwner && !loading,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/skills/${id}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, id]);

  useEffect(() => {
    async function fetchSkill() {
      if (!id || !user) return;

      try {
        const { data, error } = await (supabase
          .from("skills") as any)
          .select("*")
          .eq("id", id)
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
        const initialData: SkillFormData = {
          title: data.title,
          description: data.description || "",
          content: data.content,
          tags: data.tags || [],
          published: data.published,
        };
        setFormData(initialData);
        resetLastSaved(initialData);
      } catch (err) {
        console.error("Error fetching skill:", err);
        toast.error("Failed to load skill");
        navigate("/library");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSkill();
    }
  }, [id, user, navigate, resetLastSaved]);

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

  const handleSubmit = async (shouldPublish?: boolean) => {
    if (!user || !id) return;

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        content: formData.content.trim(),
        tags: formData.tags.length > 0 ? formData.tags : null,
        published: shouldPublish !== undefined ? shouldPublish : formData.published,
      };

      const { error } = await (supabase.from("skills") as any)
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Error updating skill:", error);
        toast.error("Failed to update skill");
        return;
      }

      resetLastSaved({ ...formData, published: updateData.published });
      toast.success("Skill updated!");
      navigate(`/skills/${id}`);
    } catch (err) {
      console.error("Error updating skill:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this skill?")) return;

    try {
      const { error } = await (supabase.from("skills") as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Skill deleted");
      navigate("/library");
    } catch (err) {
      console.error("Error deleting skill:", err);
      toast.error("Failed to delete skill");
    }
  };

  // Diff content
  const diffContent = useMemo(() => {
    if (!lastSaved) return { original: "", current: "" };
    return {
      original: lastSaved.content,
      current: formData.content,
    };
  }, [lastSaved, formData.content]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !skill) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Link 
            to="/library" 
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-display-md font-bold text-foreground">
                Edit Skill
              </h1>
              <p className="mt-2 text-muted-foreground">
                Update your skill file.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AutosaveIndicator status={status} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiff(true)}
                disabled={!hasChanges}
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                View Changes
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Expert Content Writer"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="content">Skill Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the skill file content..."
                rows={12}
                className="font-mono text-sm"
              />
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

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">{formData.published ? "Published" : "Draft"}</Label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {formData.published ? "Update" : "Publish"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <DiffViewerModal
        open={showDiff}
        onOpenChange={setShowDiff}
        title={formData.title || "Skill"}
        original={diffContent.original}
        current={diffContent.current}
        showVersionButton={false}
      />
    </div>
  );
}
