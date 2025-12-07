import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Library as LibraryIcon, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Library() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthContext();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/library", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
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
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-display-md font-bold text-foreground">My Library</h1>
              <p className="mt-1 text-muted-foreground">
                Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}! This page will show your saved and created prompts.
              </p>
            </div>
            <Link to="/prompt-creation-publishing-premium-free-">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Prompt
              </Button>
            </Link>
          </div>

          {/* Empty State */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <LibraryIcon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Your library is empty</h2>
              <p className="mb-6 max-w-md text-muted-foreground">
                Start building your prompt collection by creating your own prompts or saving ones you discover.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/prompt-creation-publishing-premium-free-">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Prompt
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Explore Prompts
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Plan Info */}
          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
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
