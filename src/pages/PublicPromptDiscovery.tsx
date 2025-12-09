import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CategoryFilter } from "@/components/prompts/CategoryFilter";
import { usePrompts } from "@/hooks/usePrompts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, Clock, Star, Filter, Tag, X } from "lucide-react";
import heroDiscover from "@/assets/hero-discover.png";

export default function PublicPromptDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"trending" | "recent" | "rating">("trending");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: prompts, isLoading, error } = usePrompts();

  // Extract all unique tags from prompts for the tag filter
  const allTags = useMemo(() => {
    if (!prompts) return [];
    const tagSet = new Set<string>();
    prompts.forEach((prompt) => {
      if (prompt.tags && Array.isArray(prompt.tags)) {
        prompt.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  // Initialize selected tags from URL query param
  useEffect(() => {
    const tagParam = searchParams.get("tag");
    if (tagParam) {
      setSelectedTags([tagParam]);
    }
  }, []);

  // Update URL when tags change
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      
      // Update URL
      if (newTags.length === 0) {
        searchParams.delete("tag");
      } else if (newTags.length === 1) {
        searchParams.set("tag", newTags[0]);
      } else {
        searchParams.delete("tag"); // For multiple tags, don't persist to URL
      }
      setSearchParams(searchParams, { replace: true });
      
      return newTags;
    });
  };

  const clearTags = () => {
    setSelectedTags([]);
    searchParams.delete("tag");
    setSearchParams(searchParams, { replace: true });
  };

  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];
    
    return prompts.filter((prompt) => {
      const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
      const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.short_description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Tag filter with OR logic
      const matchesTags = selectedTags.length === 0 || 
        (prompt.tags && prompt.tags.some((tag) => selectedTags.includes(tag)));
      
      return matchesCategory && matchesSearch && matchesTags;
    });
  }, [prompts, selectedCategory, searchQuery, selectedTags]);

  const sortedPrompts = useMemo(() => {
    return [...filteredPrompts].sort((a, b) => {
      if (sortBy === "rating") return Number(b.rating_avg) - Number(a.rating_avg);
      if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.copies_count - a.copies_count; // trending
    });
  }, [filteredPrompts, sortBy]);

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

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Filter by Tags</span>
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTags}
                    className="h-7 text-xs gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear tags
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-destructive text-lg mb-4">Failed to load prompts. Please try again later.</p>
          </div>
        )}

        {/* Prompts Grid */}
        {!isLoading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}

        {!isLoading && !error && sortedPrompts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No prompts found matching your criteria.</p>
            <Button variant="outline" className="mt-4" onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
              clearTags();
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
