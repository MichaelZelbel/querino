import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSavedPrompts } from "@/hooks/useSavedPrompts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Star, Bookmark, BookmarkCheck, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Prompt } from "@/types/prompt";
import { format } from "date-fns";

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { isPromptSaved, toggleSave } = useSavedPrompts();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const isSaved = id ? isPromptSaved(id) : false;
  const isAuthor = prompt?.author_id && user?.id === prompt.author_id;

  useEffect(() => {
    async function fetchPrompt() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Try to fetch as public first, or if user owns it
        let query = supabase
          .from("prompts")
          .select("*")
          .eq("id", id);
        
        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error("Error fetching prompt:", error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else {
          setPrompt(data as Prompt);
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
    
    // Redirect to auth if not logged in
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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-warning text-warning" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-warning/50 text-warning" />
        );
      } else {
        stars.push(
          <Star key={i} className="h-5 w-5 text-muted-foreground/30" />
        );
      }
    }
    return stars;
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
              {prompt.tags && prompt.tags.length > 0 && (
                <>
                  {prompt.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-sm">
                      {tag}
                    </Badge>
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
            
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Created {format(new Date(prompt.created_at), "MMM d, yyyy")}
              </span>
              <span className="text-border">•</span>
              <span>{prompt.copies_count.toLocaleString()} copies</span>
            </div>
          </div>

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

          {/* Action Bar */}
          <div className="mb-12 flex flex-wrap gap-3">
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

            {isAuthor && (
              <Link to={`/prompts/${id}/edit`}>
                <Button size="lg" variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
          </div>

          {/* Ratings Section */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Rating
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {renderStars(prompt.rating_avg)}
              </div>
              <span className="text-2xl font-bold text-foreground">
                {Number(prompt.rating_avg).toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({prompt.rating_count} {prompt.rating_count === 1 ? "rating" : "ratings"})
              </span>
            </div>
            
            <div className="mt-4">
              <Button variant="secondary" disabled className="gap-2">
                <Star className="h-4 w-4" />
                Rate this prompt
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                Rating feature coming soon
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
