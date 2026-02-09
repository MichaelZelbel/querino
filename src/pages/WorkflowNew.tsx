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
import { Loader2, X, FileText, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";
import { LanguageSelect } from "@/components/shared/LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/config/languages";

export default function WorkflowNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isPremium } = usePremiumCheck();
  const { checkCredits } = useAICreditsGate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [content, setContent] = useState("");
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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!content.trim()) {
      newErrors.content = "Workflow content is required";
    }

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSuggestMetadata = async () => {
    // Check credits before making AI call
    if (!checkCredits()) {
      return;
    }

    if (!content.trim()) {
      setMetadataError("Please add some workflow content first.");
      return;
    }

    setIsGeneratingMetadata(true);
    setMetadataError(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("suggest-workflow-metadata", {
        body: { workflow_content: content.trim(), user_id: user?.id },
      });

      if (error) {
        throw new Error("Failed to generate suggestions");
      }

      const data = result.output || result;

      // Populate form fields with suggestions
      if (data.title) {
        setTitle(data.title);
      }
      
      if (data.description) {
        setDescription(data.description);
      }
      
      // Set category if provided and valid
      if (data.category) {
        const matchedCategory = categoryOptions.find(cat => 
          cat.id.toLowerCase() === data.category.toLowerCase()
        );
        if (matchedCategory) {
          setCategory(matchedCategory.id);
        }
      }
      
      // Replace tags with suggested tags
      if (data.tags && Array.isArray(data.tags)) {
        const normalizedTags = data.tags
          .map((tag: string) => normalizeTag(tag))
          .filter((tag: string) => tag)
          .slice(0, 10);
        setTags(normalizedTags);
      }
      
      toast.success("Metadata suggestions applied!");
    } catch (error) {
      console.error("Error suggesting metadata:", error);
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
      const { data: newWorkflow, error } = await (supabase
        .from("workflows") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim(),
          category: category,
          tags: tags.length > 0 ? tags : null,
          author_id: user.id,
          published: isPublic,
          language,
          // Keep json empty for new Antigravity workflows
          json: {},
        })
        .select("slug")
        .single();

      if (error) {
        console.error("Error creating workflow:", error);
        toast.error("Failed to create workflow");
        return;
      }

      toast.success("Workflow created!");
      navigate(`/workflows/${newWorkflow.slug}`);
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
              Create an Antigravity workflow as a Markdown file.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            {/* Workflow Markdown Content - FIRST */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="content">Workflow Markdown *</Label>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`# My Workflow

## Description
Describe what this workflow does...

## Steps
1. First step...
2. Second step...

## Example
\`\`\`
Example usage here
\`\`\``}
                rows={14}
                className={`font-mono text-sm ${errors.content ? "border-destructive" : ""}`}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Write your workflow instructions in Markdown format.
              </p>
              
              {/* AI Metadata Suggestion */}
              <div className="pt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSuggestMetadata}
                        disabled={isGeneratingMetadata || !isPremium}
                        className="gap-2"
                      >
                        {isGeneratingMetadata ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isPremium ? (
                          <Sparkles className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        {isGeneratingMetadata ? "Generating..." : "Suggest title, description, category & tags"}
                      </Button>
                    </TooltipTrigger>
                    {!isPremium && (
                      <TooltipContent>
                        <p>Premium feature – upgrade to use AI suggestions</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {metadataError && (
                  <p className="text-sm text-destructive mt-2">{metadataError}</p>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Code Review Workflow"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
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

            {/* Language */}
            <LanguageSelect value={language} onChange={setLanguage} />

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
