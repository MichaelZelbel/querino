import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptForm } from "@/components/prompts/PromptForm";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PromptNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/prompts/new", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (data: {
    title: string;
    short_description: string;
    content: string;
    category: string;
    tags: string[];
    is_public: boolean;
  }) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const { data: newPrompt, error } = await supabase
        .from("prompts")
        .insert({
          title: data.title,
          short_description: data.short_description,
          content: data.content,
          category: data.category,
          tags: data.tags.length > 0 ? data.tags : null,
          is_public: data.is_public,
          author_id: user.id,
          rating_avg: 0,
          rating_count: 0,
          copies_count: 0,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating prompt:", error);
        toast.error("Failed to create prompt. Please try again.");
        return;
      }

      toast.success("Prompt created successfully!");
      navigate(`/prompts/${newPrompt.id}`);
    } catch (err) {
      console.error("Error creating prompt:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/library");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8">
            <h1 className="text-display-md font-bold text-foreground">
              Create New Prompt
            </h1>
            <p className="mt-2 text-muted-foreground">
              Share your prompt with the community or keep it private for personal use.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <PromptForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel="Create Prompt"
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}