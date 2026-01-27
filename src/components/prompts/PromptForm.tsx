import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Sparkles, Lock } from "lucide-react";
import { categoryOptions } from "@/types/prompt";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PromptFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  is_public: boolean;
}

interface PromptFormProps {
  initialData?: PromptFormData;
  onSubmit: (data: PromptFormData) => Promise<void>;
  onCancel: () => void;
  onChange?: (data: PromptFormData) => void;
  submitLabel: string;
  isSubmitting: boolean;
}

export function PromptForm({
  initialData,
  onSubmit,
  onCancel,
  onChange,
  submitLabel,
  isSubmitting,
}: PromptFormProps) {
  const { isPremium } = usePremiumCheck();
  const { checkCredits } = useAICreditsGate();
  const { user } = useAuthContext();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // AI tag suggestion state
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagSuggestionError, setTagSuggestionError] = useState<string | null>(null);
  
  // AI metadata suggestion state
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Notify parent of changes
  useEffect(() => {
    onChange?.({
      title,
      description,
      content,
      category,
      tags,
      is_public: isPublic,
    });
  }, [title, description, content, category, tags, isPublic, onChange]);

  const normalizeTag = (tag: string): string => {
    return tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, '') // Remove special chars except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
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

  const handleSuggestTags = async () => {
    // Check credits before making AI call
    if (!checkCredits()) {
      return;
    }

    const tagSuggestionUrl = import.meta.env.VITE_TAG_SUGGESTION_URL;
    
    if (!tagSuggestionUrl) {
      setTagSuggestionError("Tag suggestion service is not configured.");
      return;
    }

    setIsGeneratingTags(true);
    setTagSuggestionError(null);
    setSuggestedTags([]);

    try {
      const response = await fetch(tagSuggestionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate tags");
      }

      const data = await response.json();
      
      if (data.tags && Array.isArray(data.tags)) {
        // Filter out tags that are already added and normalize them
        const newSuggestions = data.tags
          .map((tag: string) => normalizeTag(tag))
          .filter((tag: string) => tag && !tags.includes(tag));
        setSuggestedTags(newSuggestions);
      }
    } catch (error) {
      console.error("Error suggesting tags:", error);
      setTagSuggestionError("Could not generate tags. Please try again.");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setSuggestedTags(suggestedTags.filter((t) => t !== tag));
    }
  };

  const handleSuggestMetadata = async () => {
    // Check credits before making AI call
    if (!checkCredits()) {
      return;
    }

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

      
      // Populate form fields with suggestions (always overwrite)
      if (result.title) {
        setTitle(result.title);
      }
      
      if (result.description) {
        setDescription(result.description);
      }
      
      // Set category if provided and valid
      if (result.category) {
        const matchedCategory = categoryOptions.find(cat => 
          cat.id.toLowerCase() === result.category.toLowerCase()
        );
        if (matchedCategory) {
          setCategory(matchedCategory.id);
        }
      }
      
      // Replace tags with suggested tags
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

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      category,
      tags,
      is_public: isPublic,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prompt Content - FIRST */}
      <div className="space-y-2">
        <Label htmlFor="content">Prompt Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your prompt here..."
          rows={12}
          className={`font-mono text-sm ${errors.content ? "border-destructive" : ""}`}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content}</p>
        )}
      </div>

      {/* AI Metadata Suggestion Button */}
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

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this prompt does and how to use it"
          rows={4}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {description.length}/2000 characters
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
        <Label htmlFor="tags">Tags (optional)</Label>
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

        {/* AI Tag Suggestion */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSuggestTags}
            disabled={isGeneratingTags || (!title.trim() && !content.trim())}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {isGeneratingTags ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Suggest Tags (AI)
              </>
            )}
          </Button>
          
          {tagSuggestionError && (
            <p className="mt-2 text-sm text-destructive">{tagSuggestionError}</p>
          )}

          {suggestedTags.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted-foreground">Suggested Tags:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleAddSuggestedTag(tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
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

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}