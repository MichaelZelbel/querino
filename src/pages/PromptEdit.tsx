import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptForm } from "@/components/prompts/PromptForm";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { Prompt } from "@/types/prompt";

export default function PromptEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/prompts/${id}/edit`, { replace: true });
    }
  }, [user, authLoading, navigate, id]);

  // Fetch prompt
  useEffect(() => {
    async function fetchPrompt() {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from("prompts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching prompt:", error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else if (data.author_id !== user.id) {
          setNotAuthorized(true);
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

    if (user) {
      fetchPrompt();
    }
  }, [id, user]);

  const handleSubmit = async (data: {
    title: string;
    short_description: string;
    content: string;
    category: string;
    tags: string[];
    is_public: boolean;
  }) => {
    if (!user || !id) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          title: data.title,
          short_description: data.short_description,
          content: data.content,
          category: data.category,
          tags: data.tags.length > 0 ? data.tags : null,
          is_public: data.is_public,
        })
        .eq("id", id)
        .eq("author_id", user.id);

      if (error) {
        console.error("Error updating prompt:", error);
        toast.error("Failed to update prompt. Please try again.");
        return;
      }

      toast.success("Prompt updated successfully!");
      navigate(`/prompts/${id}`);
    } catch (err) {
      console.error("Error updating prompt:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/prompts/${id}`);
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Prompt Not Found
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The prompt you're trying to edit doesn't exist.
            </p>
            <Link to="/library">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Not Authorized
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              You don't have permission to edit this prompt.
            </p>
            <Link to={`/prompts/${id}`}>
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Prompt
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
        <div className="container mx-auto max-w-2xl px-4">
          <Link
            to={`/prompts/${id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Prompt
          </Link>

          <div className="mb-8">
            <h1 className="text-display-md font-bold text-foreground">
              Edit Prompt
            </h1>
            <p className="mt-2 text-muted-foreground">
              Make changes to your prompt below.
            </p>
          </div>

          {prompt && (
            <div className="rounded-xl border border-border bg-card p-6">
              <PromptForm
                initialData={{
                  title: prompt.title,
                  short_description: prompt.short_description,
                  content: prompt.content,
                  category: prompt.category,
                  tags: prompt.tags || [],
                  is_public: prompt.is_public,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="Save Changes"
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}