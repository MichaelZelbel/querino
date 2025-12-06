import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PromptCard } from "@/components/prompts/PromptCard";
import { mockPrompts } from "@/data/mockPrompts";
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Star, 
  Clock, 
  TrendingUp,
  Library,
  Sparkles,
  Crown
} from "lucide-react";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Simulated user's saved prompts (subset of mock data)
  const userPrompts = mockPrompts.slice(0, 4);
  const pinnedPrompts = mockPrompts.slice(0, 2);
  
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
          {/* Welcome Section */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-display-sm font-bold text-foreground md:text-display-md">
                My Library
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage and organize your prompt collection
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="hero" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Prompt
              </Button>
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
                  <p className="text-2xl font-bold text-foreground">24</p>
                  <p className="text-sm text-muted-foreground">Total Prompts</p>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Star className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">8</p>
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
                  <p className="text-2xl font-bold text-foreground">156</p>
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
                  <p className="text-2xl font-bold text-foreground">3</p>
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
                  <h3 className="font-semibold text-foreground">Unlock Pro Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI refinement tools, unlimited storage, and GitHub sync
                  </p>
                </div>
              </div>
              <Button variant="hero" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          {/* Pinned Prompts */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Star className="h-5 w-5 text-warning" />
                Pinned Prompts
              </h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {pinnedPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          </section>

          {/* All Prompts */}
          <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                All Prompts
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>

            {filteredPrompts.length === 0 && (
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
    </div>
  );
};

export default Dashboard;
