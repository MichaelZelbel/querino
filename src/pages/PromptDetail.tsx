import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSavedPrompts } from "@/hooks/useSavedPrompts";
import { useClonePrompt } from "@/hooks/useClonePrompt";
import { usePinnedPrompts } from "@/hooks/usePinnedPrompts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewSection } from "@/components/prompts/ReviewSection";
import { Copy, Check, Bookmark, BookmarkCheck, ArrowLeft, Pencil, Lock, Calendar, Users, Sparkles, Tag, Files, FlaskConical, Pin, PinOff } from "lucide-react";
import { SendToLLMButtons } from "@/components/prompts/SendToLLMButtons";
import { RefinePromptModal } from "@/components/prompts/RefinePromptModal";
import { TestPromptModal } from "@/components/prompts/TestPromptModal";
import { toast } from "sonner";
import type { Prompt, PromptAuthor } from "@/types/prompt";
import { format } from "date-fns";

interface PromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { isPromptSaved, toggleSave } = useSavedPrompts();
  const { clonePrompt, cloning } = useClonePrompt();
  const { isPromptPinned, togglePin } = usePinnedPrompts();
  const [prompt, setPrompt] = useState<PromptWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const isSaved = id ? isPromptSaved(id) : false;
  const isPinned = id ? isPromptPinned(id) : false;
  const isAuthor = prompt?.author_id && user?.id === prompt.author_id;

  useEffect(() => {
    async function fetchPrompt() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("prompts")
          .select(`
            *,
            profiles:author_id (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching prompt:", error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else {
          // Transform the data
          const promptData: PromptWithAuthor = {
            ...(data as any),
            author: (data as any).profiles || null,
          };
          setPrompt(promptData);
        }
      } catch (err) {
        console.error("Error fetching prompt:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPrompt();
  }, [id]);

  const handleCopy = async () => {
    if (!prompt) return;
    
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy prompt");
    }
  };

  const handleSaveToLibrary = async () => {
    if (!id) return;
    
    if (!user) {
      navigate(`/auth?redirect=/prompts/${id}`);
      return;
    }

    setSaving(true);
    const { error } = await toggleSave(id);
    setSaving(false);

    if (error) {
      toast.error("Failed to update library");
      return;
    }

    if (isSaved) {
      toast.success("Removed from library");
    } else {
      toast.success("Saved to library!");
    }
  };

  const handleTogglePin = async () => {
    if (!id) return;
    
    if (!user) {
      navigate(`/auth?redirect=/prompts/${id}`);
      return;
    }

    setPinning(true);
    const { error } = await togglePin(id);
    setPinning(false);

    if (error) {
      toast.error("Failed to update pin");
      return;
    }

    if (isPinned) {
      toast.success("Unpinned from dashboard");
    } else {
      toast.success("Pinned to dashboard!");
    }
  };

  const getAuthorInitials = () => {
    if (prompt?.author?.display_name) {
      return prompt.author.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <Skeleton className="mb-4 h-8 w-48" />
            <Skeleton className="mb-8 h-12 w-3/4" />
            <Skeleton className="mb-4 h-6 w-24" />
            <Skeleton className="mb-8 h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !prompt) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Prompt Not Found
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The prompt you're looking for doesn't exist or is no longer available.
            </p>
            <Link to="/discover">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Discover
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
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Back Link */}
          <Link 
            to="/discover" 
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>

          {/* Header Section */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-sm capitalize">
                {prompt.category}
              </Badge>
              {!prompt.is_public && isAuthor && (
                <Badge variant="outline" className="gap-1 text-sm">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )}
              {prompt.tags && prompt.tags.length > 0 && (
                <>
                  {prompt.tags.slice(0, 5).map((tag) => (
                    <Link key={tag} to={`/discover?tag=${encodeURIComponent(tag)}`}>
                      <Badge 
                        variant="outline" 
                        className="text-sm gap-1 cursor-pointer hover:bg-accent transition-colors"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </>
              )}
            </div>
            
            <h1 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
              {prompt.title}
            </h1>
            
            <p className="text-lg text-muted-foreground">
              {prompt.short_description}
            </p>

            {/* Author & Meta Info */}
            <div className="mt-6 flex flex-wrap items-center gap-6">
              {/* Author */}
              {prompt.author && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={prompt.author.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getAuthorInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {prompt.author.display_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </div>
              )}

              {/* Published Date */}
              {prompt.published_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Published {format(new Date(prompt.published_at), "MMM d, yyyy")}</span>
                </div>
              )}

              {/* Copies */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{prompt.copies_count.toLocaleString()} copies</span>
              </div>
            </div>
          </div>

          {/* Summary Section (if published with summary) */}
          {prompt.summary && (
            <div className="mb-8 rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                Summary
              </h2>
              <p className="text-muted-foreground">
                {prompt.summary}
              </p>
            </div>
          )}

          {/* Prompt Content */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Prompt
            </h2>
            <div className="relative rounded-xl border border-border bg-muted/30 p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                {prompt.content}
              </pre>
            </div>
          </div>

          {/* Example Output Section */}
          {prompt.example_output && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Example Output
              </h2>
              <div className="rounded-xl border border-border bg-card p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground leading-relaxed">
                  {prompt.example_output}
                </pre>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="mb-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant={copied ? "success" : "default"}
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Prompt
                </>
              )}
            </Button>
            
            <Button
              size="lg"
              variant={isSaved ? "secondary" : "outline"}
              onClick={handleSaveToLibrary}
              disabled={saving}
              className="gap-2"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-4 w-4" />
                  Saved ✓
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  Save to My Library
                </>
              )}
            </Button>

            {user && (
              <Button
                size="lg"
                variant={isPinned ? "secondary" : "outline"}
                onClick={handleTogglePin}
                disabled={pinning}
                className="gap-2"
              >
                {isPinned ? (
                  <>
                    <PinOff className="h-4 w-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4" />
                    Pin to Dashboard
                  </>
                )}
              </Button>
            )}

            {isAuthor && (
              <Link to={`/library/${id}/edit`}>
                <Button size="lg" variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Manage Prompt
                </Button>
              </Link>
            )}

            {user && !isAuthor && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => clonePrompt(prompt, user.id)}
                disabled={cloning}
                className="gap-2"
              >
                <Files className="h-4 w-4" />
                {cloning ? "Cloning..." : "Clone Prompt"}
              </Button>
            )}

            {user && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowRefineModal(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Refine with AI
              </Button>
            )}

            {user && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowTestModal(true)}
                className="gap-2"
              >
                <FlaskConical className="h-4 w-4" />
                Test Prompt
              </Button>
            )}
          </div>

          {/* Refine Prompt Modal */}
          <RefinePromptModal
            isOpen={showRefineModal}
            onClose={() => setShowRefineModal(false)}
            promptContent={prompt.content}
            promptTitle={prompt.title}
            userId={user?.id}
          />

          {/* Test Prompt Modal */}
          <TestPromptModal
            isOpen={showTestModal}
            onClose={() => setShowTestModal(false)}
            promptContent={prompt.content}
            promptTitle={prompt.title}
            userId={user?.id}
          />

          {/* Send to LLM */}
          <div className="mb-12 rounded-xl border border-border bg-card p-6">
            <SendToLLMButtons title={prompt.title} content={prompt.content} />
          </div>

          {/* Ratings & Reviews Section */}
          <ReviewSection
            promptId={prompt.id}
            userId={user?.id}
            ratingAvg={prompt.rating_avg}
            ratingCount={prompt.rating_count}
          />

          {/* Future Features Placeholder */}
          <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/20 p-6">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Coming Soon</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-muted-foreground">Usage Analytics</Badge>
              <Badge variant="outline" className="text-muted-foreground">Similar Prompts</Badge>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
