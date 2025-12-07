import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Button } from "@/components/ui/button";
import { Loader2, Library as LibraryIcon, Sparkles } from "lucide-react";
import type { Prompt } from "@/types/prompt";

export default function Library() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/library", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch saved prompts
  useEffect(() => {
    async function fetchSavedPrompts() {
      if (!user) return;

      setLoading(true);
      try {
        // First get the saved prompt IDs
        const { data: savedData, error: savedError } = await supabase
          .from("user_saved_prompts")
          .select("prompt_id")
          .eq("user_id", user.id);

        if (savedError) {
          console.error("Error fetching saved prompts:", savedError);
          setLoading(false);
          return;
        }

        if (!savedData || savedData.length === 0) {
          setSavedPrompts([]);
          setLoading(false);
          return;
        }

        // Then fetch the actual prompts
        const promptIds = savedData.map((s) => s.prompt_id);
        const { data: promptsData, error: promptsError } = await supabase
          .from("prompts")
          .select("*")
          .in("id", promptIds)
          .eq("is_public", true);

        if (promptsError) {
          console.error("Error fetching prompts:", promptsError);
          setLoading(false);
          return;
        }

        setSavedPrompts((promptsData as Prompt[]) || []);
      } catch (err) {
        console.error("Error fetching saved prompts:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSavedPrompts();
    }
  }, [user]);

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
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-display-md font-bold text-foreground">My Library</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}! 
              {savedPrompts.length > 0 
                ? ` You have ${savedPrompts.length} saved prompt${savedPrompts.length === 1 ? "" : "s"}.`
                : ""}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedPrompts.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <LibraryIcon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                You haven't saved any prompts yet.
              </h2>
              <p className="mb-6 max-w-md text-muted-foreground">
                Start building your collection by discovering and saving prompts you love.
              </p>
              <Link to="/discover">
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Discover prompts
                </Button>
              </Link>
            </div>
          ) : (
            /* Prompts Grid */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}

          {/* Plan Info */}
          <div className="mt-12 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Current Plan: <span className="capitalize">{profile?.plan_type || "Free"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.plan_type === "free" 
                    ? "Upgrade to Premium for unlimited prompts and AI refinement tools" 
                    : "You have access to all premium features"}
                </p>
              </div>
              {profile?.plan_type === "free" && (
                <Link to="/pricing?from=library">
                  <Button size="sm" variant="default">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
