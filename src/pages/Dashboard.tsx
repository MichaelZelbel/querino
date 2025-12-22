import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PromptCard } from "@/components/prompts/PromptCard";
import { usePinnedPrompts } from "@/hooks/usePinnedPrompts";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import heroDashboard from "@/assets/hero-dashboard.png";
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Pin, 
  Clock, 
  TrendingUp,
  Library,
  Sparkles,
  Crown
} from "lucide-react";
import type { Prompt, PromptAuthor } from "@/types/prompt";

interface PromptWithAuthor extends Prompt {
  author?: PromptAuthor | null;
}

const Dashboard = () => {
  const { user } = useAuthContext();
  const { pinnedPrompts, loading: pinnedLoading, refetch: refetchPinned, isPromptPinned } = usePinnedPrompts();
  const [searchQuery, setSearchQuery] = useState("");
  const [userPrompts, setUserPrompts] = useState<PromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrompts: 0,
    pinnedCount: 0,
    totalCopies: 0,
    recentEdits: 0,
  });

  useEffect(() => {
    refetchPinned();
  }, [refetchPinned]);

  useEffect(() => {
    async function fetchUserPrompts() {
      if (!user) {
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
          .eq("author_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching user prompts:", error);
          return;
        }

        const prompts = (data || []).map((p: any) => ({
          ...p,
          author: p.profiles || null,
        }));

        setUserPrompts(prompts);

        // Calculate stats
        const totalCopies = prompts.reduce((sum, p) => sum + (p.copies_count || 0), 0);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentEdits = prompts.filter(
          (p) => new Date(p.updated_at) > oneWeekAgo
        ).length;

        setStats({
          totalPrompts: prompts.length,
          pinnedCount: pinnedPrompts.length,
          totalCopies,
          recentEdits,
        });
      } catch (err) {
        console.error("Error fetching user prompts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserPrompts();
  }, [user, pinnedPrompts.length]);

  const filteredPrompts = userPrompts.filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section with Hero Image */}
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-display-sm font-bold text-foreground md:text-display-md">
                My Library
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage and organize your prompt collection
              </p>
            </div>
            <div className="hidden lg:block w-64">
              <img 
                src={heroDashboard} 
                alt="Dashboard Overview" 
                className="w-full rounded-lg shadow-md opacity-80"
              />
            </div>
            <div className="flex gap-3">
              <Link to="/prompts/new">
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Prompt
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card variant="elevated">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Library className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalPrompts}</p>
                  <p className="text-sm text-muted-foreground">Total Prompts</p>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Pin className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pinnedPrompts.length}</p>
                  <p className="text-sm text-muted-foreground">Pinned</p>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCopies}</p>
                  <p className="text-sm text-muted-foreground">Total Copies</p>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.recentEdits}</p>
                  <p className="text-sm text-muted-foreground">Recent Edits</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Banner */}
          <Card variant="accent" className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Unlock Premium Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI refinement tools, unlimited storage, and GitHub sync
                  </p>
                </div>
              </div>
              <Link to="/pricing?from=dashboard">
                <Button variant="hero" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Premium
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pinned Prompts */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Pin className="h-5 w-5 text-warning" />
                Pinned Prompts
              </h2>
            </div>
            {pinnedLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                ))}
              </div>
            ) : pinnedPrompts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {pinnedPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    currentUserId={user?.id}
                    editPath="library"
                    showAuthorInfo
                    isPinned
                  />
                ))}
              </div>
            ) : (
              <Card variant="default" className="py-8 text-center">
                <CardContent>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Pin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">No pinned prompts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Pin your favorite prompts to access them quickly!
                  </p>
                  <Link to="/discover" className="mt-4 inline-block">
                    <Button variant="outline" size="sm" className="gap-2">
                      Discover Prompts
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>

          {/* All Prompts */}
          <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                My Prompts
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search your prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                ))}
              </div>
            ) : filteredPrompts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    currentUserId={user?.id}
                    editPath="library"
                    showAuthorBadge
                    isPinned={isPromptPinned(prompt.id)}
                  />
                ))}
              </div>
            ) : userPrompts.length === 0 ? (
              <Card variant="default" className="py-12 text-center">
                <CardContent>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Library className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">No prompts yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first prompt or explore the community
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link to="/prompts/new">
                      <Button variant="default" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Prompt
                      </Button>
                    </Link>
                    <Link to="/discover">
                      <Button variant="outline" size="sm">
                        Discover Prompts
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card variant="default" className="py-12 text-center">
                <CardContent>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">No prompts found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or create a new prompt
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
