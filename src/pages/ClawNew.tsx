import { useState, useEffect, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Loader2, X, Grab, Sparkles, Lock, FileText, Download, Link, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { categoryOptions } from "@/types/prompt";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";
import type { SkillSourceType } from "@/types/claw";
import { parseSkillSourceUrl, getSkillSourceDescription } from "@/lib/skillSourceParser";

const SKILL_MD_TEMPLATE = `# Skill Name

## Description
This skill defines the interface and behavior for a Clawbot capability.

## Parameters
- \`param1\`: Description of parameter 1
- \`param2\`: Description of parameter 2

## Behavior
Describe what this skill does when invoked...

## Example Usage
\`\`\`
Example of how Clawbot might call this skill
\`\`\`
`;

type SkillContentMode = 'inline' | 'remote';

export default function ClawNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isPremium } = usePremiumCheck();
  const { checkCredits } = useAICreditsGate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Skill content mode
  const [skillContentMode, setSkillContentMode] = useState<SkillContentMode>('inline');
  
  // Inline mode state
  const [skillMdContent, setSkillMdContent] = useState(SKILL_MD_TEMPLATE);
  
  // Remote mode state - single URL input
  const [skillSourceUrl, setSkillSourceUrl] = useState("");
  const [skillMdCached, setSkillMdCached] = useState<string | null>(null);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Parse the skill source URL
  const parsedSource = useMemo(() => parseSkillSourceUrl(skillSourceUrl), [skillSourceUrl]);
  
  // Metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // AI metadata suggestion state
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/claws/new", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Read URL params for prefilled data (from import)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("title")) setTitle(params.get("title") || "");
    if (params.get("description")) setDescription(params.get("description") || "");
    if (params.get("tags")) setTags(params.get("tags")?.split(",") || []);
    if (params.get("content")) setSkillMdContent(params.get("content") || SKILL_MD_TEMPLATE);
  }, []);

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

  // Get the active SKILL.md content for validation and AI suggestions
  const getActiveSkillContent = (): string => {
    if (skillContentMode === 'inline') {
      return skillMdContent;
    }
    return skillMdCached || "";
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (skillContentMode === 'inline') {
      if (!skillMdContent.trim()) {
        newErrors.skillMdContent = "SKILL.md content is required";
      }
    } else {
      if (!skillSourceUrl.trim()) {
        newErrors.skillSourceUrl = "Skill Source URL is required";
      } else if (!parsedSource.isValid) {
        newErrors.skillSourceUrl = parsedSource.error || "Invalid URL";
      }
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
    if (!checkCredits()) return;

    const activeContent = getActiveSkillContent();
    if (!activeContent.trim()) {
      setMetadataError("Please add SKILL.md content first.");
      return;
    }

    setIsGeneratingMetadata(true);
    setMetadataError(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("suggest-claw-metadata", {
        body: { claw_content: activeContent.trim(), user_id: user?.id },
      });

      if (error) {
        throw new Error("Failed to generate suggestions");
      }

      const data = result.output || result;

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      
      if (data.category) {
        const matchedCategory = categoryOptions.find(cat => 
          cat.id.toLowerCase() === data.category.toLowerCase()
        );
        if (matchedCategory) setCategory(matchedCategory.id);
      }
      
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

  const handleFetchRemoteSkill = async () => {
    if (!parsedSource.isValid) {
      setFetchError(parsedSource.error || "Please enter a valid URL.");
      return;
    }

    setIsFetchingRemote(true);
    setFetchError(null);
    setSkillMdCached(null);

    try {
      // Use edge function to bypass CORS
      const { data, error } = await supabase.functions.invoke('fetch-skill-md', {
        body: {
          sourceType: parsedSource.sourceType,
          sourceRef: parsedSource.sourceRef,
          sourcePath: parsedSource.sourcePath,
          sourceVersion: parsedSource.sourceVersion,
          originalUrl: skillSourceUrl.trim(),
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch SKILL.md');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.content) {
        throw new Error('No content returned from fetch');
      }

      setIsFetchingRemote(false);
      setSkillMdCached(data.content);
      toast.success("SKILL.md fetched successfully!");
    } catch (error) {
      console.error("Error fetching remote skill:", error);
      setIsFetchingRemote(false);
      const errorMessage = error instanceof Error ? error.message : "Could not find SKILL.md at this URL.";
      setFetchError(errorMessage);
    }
  };

  const handleImportAsEditable = () => {
    if (!skillMdCached) return;
    
    // Copy cached content to editable content
    setSkillMdContent(skillMdCached);
    
    // Switch to inline mode
    setSkillContentMode('inline');
    
    // Clear remote references
    setSkillSourceUrl("");
    setSkillMdCached(null);
    
    toast.success("Imported as editable copy!");
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Determine the skill source type for storage from parsed URL
      const skillSourceType: SkillSourceType = skillContentMode === 'inline' 
        ? 'inline' 
        : (parsedSource.sourceType || 'github');

      const { data: newClaw, error } = await (supabase
        .from("claws") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          content: skillContentMode === 'inline' ? skillMdContent.trim() : null, // Legacy field
          category: category,
          tags: tags.length > 0 ? tags : null,
          source: "clawbot",
          author_id: user.id,
          published: isPublic,
          // New skill source fields
          skill_source_type: skillSourceType,
          skill_source_ref: skillContentMode === 'remote' ? parsedSource.sourceRef : null,
          skill_source_path: skillContentMode === 'remote' ? parsedSource.sourcePath : null,
          skill_source_version: skillContentMode === 'remote' ? parsedSource.sourceVersion : null,
          skill_md_content: skillContentMode === 'inline' ? skillMdContent.trim() : null,
          skill_md_cached: skillContentMode === 'remote' ? skillMdCached : null,
        })
        .select("slug")
        .single();

      if (error) {
        console.error("Error creating claw:", error);
        toast.error("Failed to create claw");
        return;
      }

      toast.success("Claw created!");
      navigate(`/claws/${newClaw.slug}`);
    } catch (err) {
      console.error("Error creating claw:", err);
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
            <div className="flex items-center gap-3 mb-2">
              <Grab className="h-7 w-7 text-amber-500" />
              <h1 className="text-display-md font-bold text-foreground">
                Create New Claw
              </h1>
            </div>
            <p className="mt-2 text-muted-foreground">
              A Claw is a callable capability typically used by Clawbot.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            {/* Skill Content Mode Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                <Label className="text-base font-medium">Skill Content</Label>
              </div>
              
              <RadioGroup
                value={skillContentMode}
                onValueChange={(value) => setSkillContentMode(value as SkillContentMode)}
                className="grid gap-3"
              >
                <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="inline" id="inline" />
                  <Label htmlFor="inline" className="flex-1 cursor-pointer">
                    <div className="font-medium">Write SKILL.md manually</div>
                    <div className="text-sm text-muted-foreground">
                      Define the skill interface and behavior directly
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote" className="flex-1 cursor-pointer">
                    <div className="font-medium">Link existing skill (GitHub or ClawHub)</div>
                    <div className="text-sm text-muted-foreground">
                      Reference an existing SKILL.md from a remote source
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Inline Mode: SKILL.md Editor */}
            {skillContentMode === 'inline' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Grab className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="skillMdContent">SKILL.md *</Label>
                </div>
                <Textarea
                  id="skillMdContent"
                  value={skillMdContent}
                  onChange={(e) => setSkillMdContent(e.target.value)}
                  placeholder={SKILL_MD_TEMPLATE}
                  rows={14}
                  className={`font-mono text-sm ${errors.skillMdContent ? "border-destructive" : ""}`}
                />
                {errors.skillMdContent && (
                  <p className="text-sm text-destructive">{errors.skillMdContent}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is the SKILL.md file that defines the Claw's interface and behavior.
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
            )}

            {/* Remote Mode: Source Selector and Fields */}
            {skillContentMode === 'remote' && (
              <div className="space-y-4">
                {/* Single Skill Source URL Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-amber-500" />
                    <Label htmlFor="skillSourceUrl">Skill Source URL *</Label>
                  </div>
                  <Input
                    id="skillSourceUrl"
                    value={skillSourceUrl}
                    onChange={(e) => {
                      setSkillSourceUrl(e.target.value);
                      setSkillMdCached(null);
                      setFetchError(null);
                    }}
                    placeholder="https://github.com/org/repo/tree/main/skills/web-search"
                    className={errors.skillSourceUrl ? "border-destructive" : ""}
                  />
                  {errors.skillSourceUrl && (
                    <p className="text-sm text-destructive">{errors.skillSourceUrl}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Paste a link to a GitHub repository, a folder containing SKILL.md, or a ClawHub skill.
                  </p>
                  
                  {/* URL Parse Status Indicator */}
                  {skillSourceUrl.trim() && (
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                      {parsedSource.isValid ? (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">
                              {parsedSource.sourceType === 'github' ? 'GitHub' : 'ClawHub'}
                            </span>
                            {parsedSource.sourceRef && (
                              <span className="ml-1">— {parsedSource.sourceRef}</span>
                            )}
                            {parsedSource.sourcePath && (
                              <span className="block text-xs">
                                Path: {parsedSource.sourcePath}
                              </span>
                            )}
                            {parsedSource.sourceVersion && parsedSource.sourceVersion !== 'latest' && (
                              <span className="block text-xs">
                                Version: {parsedSource.sourceVersion}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-destructive">
                          {parsedSource.error || "Enter a GitHub or ClawHub URL"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Fetch Button */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleFetchRemoteSkill}
                  disabled={isFetchingRemote || !parsedSource.isValid}
                  className="gap-2"
                >
                  {isFetchingRemote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isFetchingRemote ? "Fetching..." : "Fetch SKILL.md"}
                </Button>
                
                {fetchError && (
                  <p className="text-sm text-destructive">{fetchError}</p>
                )}

                {/* Cached SKILL.md Preview */}
                {skillMdCached && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>SKILL.md Preview (read-only)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImportAsEditable}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Import as editable copy
                      </Button>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                        {skillMdCached}
                      </pre>
                    </div>
                  </div>
                )}

                {/* AI Metadata Suggestion for remote mode */}
                {skillMdCached && (
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
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Search Documents Claw"
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
                placeholder="Brief description of what this claw does..."
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

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="visibility" className="text-base">
                  Make this claw public
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "Anyone can discover and use this claw"
                    : "Only you can see this claw"}
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
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Claw
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
