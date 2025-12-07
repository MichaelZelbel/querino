import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Button } from "@/components/ui/button";
import { Loader2, Library as LibraryIcon, Sparkles, Plus, Wand2 } from "lucide-react";
import type { Prompt } from "@/types/prompt";

interface UserRatings {
  [promptId: string]: number;
}

export default function Library() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [userRatings, setUserRatings] = useState<UserRatings>({});
  const [loading, setLoading] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/library", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch saved prompts and user's own prompts
  useEffect(() => {
    async function fetchLibraryData() {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch saved prompt IDs
        const { data: savedData, error: savedError } = await supabase
          .from("user_saved_prompts")
          .select("prompt_id")
          .eq("user_id", user.id);

        if (savedError) {
          console.error("Error fetching saved prompts:", savedError);
        }

        // Fetch user's own prompts
        const { data: ownPrompts, error: ownError } = await supabase
          .from("prompts")
          .select("*")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });

        if (ownError) {
          console.error("Error fetching own prompts:", ownError);
        } else {
          setMyPrompts((ownPrompts as Prompt[]) || []);
        }

        // Fetch saved prompts details
        if (savedData && savedData.length > 0) {
          const promptIds = savedData.map((s) => s.prompt_id);
          const { data: promptsData, error: promptsError } = await supabase
            .from("prompts")
            .select("*")
            .in("id", promptIds);

          if (promptsError) {
            console.error("Error fetching prompts:", promptsError);
          } else {
            setSavedPrompts((promptsData as Prompt[]) || []);
          }

          // Fetch user's ratings for saved prompts
          const { data: ratingsData, error: ratingsError } = await supabase
            .from("prompt_reviews")
            .select("prompt_id, rating")
            .eq("user_id", user.id)
            .in("prompt_id", promptIds);

          if (ratingsError) {
            console.error("Error fetching ratings:", ratingsError);
          } else if (ratingsData) {
            const ratings: UserRatings = {};
            ratingsData.forEach((r) => {
              ratings[r.prompt_id] = r.rating;
            });
            setUserRatings(ratings);
          }
        } else {
          setSavedPrompts([]);
        }
      } catch (err) {
        console.error("Error fetching library data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchLibraryData();
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
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-display-md font-bold text-foreground">My Library</h1>
              <p className="mt-1 text-muted-foreground">
                Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}!
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/prompts/wizard">
                <Button variant="outline" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Prompt Wizard
                </Button>
              </Link>
              <Link to="/prompts/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Prompt
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-12">
              {/* My Prompts Section */}
              {myPrompts.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                    My Prompts ({myPrompts.length})
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {myPrompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        showAuthorBadge
                        currentUserId={user?.id}
                        editPath="library"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Saved Prompts Section */}
              <section>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Saved Prompts ({savedPrompts.length})
                </h2>
                {savedPrompts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <LibraryIcon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      No saved prompts yet
                    </h3>
                    <p className="mb-6 max-w-md text-muted-foreground">
                      Discover and save prompts you love to build your collection.
                    </p>
                    <Link to="/discover">
                      <Button variant="secondary" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Discover prompts
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {savedPrompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        currentUserId={user?.id}
                        userRating={userRatings[prompt.id]}
                      />
                    ))}
                  </div>
                )}
              </section>
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