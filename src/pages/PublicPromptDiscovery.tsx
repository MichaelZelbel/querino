import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CategoryFilter } from "@/components/prompts/CategoryFilter";
import { mockPrompts, categories } from "@/data/mockPrompts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Clock, Star, Filter } from "lucide-react";
import heroDiscover from "@/assets/hero-discover.png";

export default function PublicPromptDiscovery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"trending" | "recent" | "rating">("trending");

  const filteredPrompts = mockPrompts.filter((prompt) => {
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "recent") return b.id.localeCompare(a.id);
    return b.copies - a.copies; // trending
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Page Header with Hero Image */}
        <div className="mb-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 p-8">
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h1 className="font-display text-display-lg text-foreground mb-4">
              Discover Prompts
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse thousands of curated AI prompts created by the community. Find the perfect prompt for your needs and copy it instantly.
            </p>
          </div>
          <img 
            src={heroDiscover} 
            alt="Discover Prompts"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "trending" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("trending")}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </Button>
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("recent")}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Recent
              </Button>
              <Button
                variant={sortBy === "rating" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("rating")}
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                Top Rated
              </Button>
            </div>
          </div>

          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{sortedPrompts.length}</span> prompts
          </p>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Sorted by {sortBy === "trending" ? "popularity" : sortBy === "recent" ? "newest" : "rating"}
            </span>
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>

        {sortedPrompts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No prompts found matching your criteria.</p>
            <Button variant="outline" className="mt-4" onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
