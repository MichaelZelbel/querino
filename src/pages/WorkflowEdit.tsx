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
import { Loader2, X, Save, Send, ArrowLeft, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Workflow } from "@/types/workflow";

export default function WorkflowEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/workflows/${id}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, id]);

  useEffect(() => {
    async function fetchWorkflow() {
      if (!id || !user) return;

      try {
        const { data, error } = await (supabase
          .from("workflows") as any)
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error || !data) {
          toast.error("Workflow not found");
          navigate("/library");
          return;
        }

        if (data.author_id !== user.id) {
          toast.error("You don't have permission to edit this workflow");
          navigate("/library");
          return;
        }

        setWorkflow(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setJsonContent(JSON.stringify(data.json, null, 2));
        setTags(data.tags || []);
        setPublished(data.published);
      } catch (err) {
        console.error("Error fetching workflow:", err);
        toast.error("Failed to load workflow");
        navigate("/library");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchWorkflow();
    }
  }, [id, user, navigate]);

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

  const validateJson = () => {
    if (!jsonContent.trim()) {
      setJsonValid(null);
      return false;
    }
    try {
      JSON.parse(jsonContent);
      setJsonValid(true);
      toast.success("Valid JSON!");
      return true;
    } catch (err) {
      setJsonValid(false);
      toast.error("Invalid JSON format");
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonContent(value);
    setJsonValid(null);
  };

  const handleSubmit = async (shouldPublish?: boolean) => {
    if (!user || !id) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!jsonContent.trim()) {
      toast.error("Workflow JSON is required");
      return;
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonContent);
    } catch {
      toast.error("Invalid JSON format");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await (supabase
        .from("workflows") as any)
        .update({
          title: title.trim(),
          description: description.trim() || null,
          json: parsedJson,
          tags: tags.length > 0 ? tags : null,
          published: shouldPublish !== undefined ? shouldPublish : published,
        })
        .eq("id", id);

      if (error) {
        console.error("Error updating workflow:", error);
        toast.error("Failed to update workflow");
        return;
      }

      toast.success("Workflow updated!");
      navigate(`/workflows/${id}`);
    } catch (err) {
      console.error("Error updating workflow:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const { error } = await (supabase
        .from("workflows") as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Workflow deleted");
      navigate("/library");
    } catch (err) {
      console.error("Error deleting workflow:", err);
      toast.error("Failed to delete workflow");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !workflow) {
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
                Edit Workflow
              </h1>
              <p className="mt-2 text-muted-foreground">
                Update your workflow configuration.
              </p>
            </div>
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

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Email Automation Pipeline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this workflow does..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="json">Workflow JSON *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={validateJson}
                  className="gap-2"
                >
                  {jsonValid === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {jsonValid === false && <AlertCircle className="h-4 w-4 text-destructive" />}
                  Validate JSON
                </Button>
              </div>
              <Textarea
                id="json"
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder='{"nodes": [], "connections": {}}'
                rows={12}
                className={`font-mono text-sm ${
                  jsonValid === true ? "border-green-500" : jsonValid === false ? "border-destructive" : ""
                }`}
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
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
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
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label htmlFor="published">{published ? "Published" : "Draft"}</Label>
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
                  {published ? "Update" : "Publish"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
