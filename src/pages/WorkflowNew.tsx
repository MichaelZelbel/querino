import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/workflows/new", { replace: true });
    }
  }, [user, authLoading, navigate]);

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

  const handleSubmit = async () => {
    if (!user) return;

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
      const { data: newWorkflow, error } = await (supabase
        .from("workflows") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          json: parsedJson,
          tags: tags.length > 0 ? tags : null,
          author_id: user.id,
          published: isPublic,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating workflow:", error);
        toast.error("Failed to create workflow");
        return;
      }

      toast.success("Workflow created!");
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (err) {
      console.error("Error creating workflow:", err);
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

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8">
            <h1 className="text-display-md font-bold text-foreground">
              Create New Workflow
            </h1>
            <p className="mt-2 text-muted-foreground">
              Share an n8n or Antigravity workflow with the community.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            {/* Workflow JSON - FIRST */}
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

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="visibility" className="text-base">
                  Make this workflow public
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "Anyone can discover and use this workflow"
                    : "Only you can see this workflow"}
                </p>
              </div>
              <Switch
                id="visibility"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workflow
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
