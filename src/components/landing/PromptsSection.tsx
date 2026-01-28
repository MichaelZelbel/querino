import { useState, useMemo } from "react";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CategoryFilter } from "@/components/prompts/CategoryFilter";
import { useSearchPrompts } from "@/hooks/useSearchPrompts";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Clock, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SortOption = "trending" | "newest" | "rating";

interface PromptsSectionProps {
  showHeader?: boolean;
}

export function PromptsSection({ showHeader = true }: PromptsSectionProps) {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isSearching = debouncedSearch.trim().length > 0;
  
  // Full-text search
  const { data: prompts, isLoading, error } = useSearchPrompts({ 
    searchQuery: debouncedSearch,
    isPublic: true 
  });

  const filteredAndSortedPrompts = useMemo(() => {
    if (!prompts) return [];
    
    // Filter by category
    const filtered = prompts.filter((prompt) => {
      return category === "all" || prompt.category === category;
    });

    // Skip sorting when searching (server provides relevance/similarity-ranked results)
    if (isSearching) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "trending":
          const trendingA = (a.copies_count || 0) + (a.rating_avg || 0) * 10;
          const trendingB = (b.copies_count || 0) + (b.rating_avg || 0) * 10;
          return trendingB - trendingA;
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "rating":
          return (b.rating_avg || 0) - (a.rating_avg || 0);
        default:
          return 0;
      }
    });
  }, [prompts, category, sortBy, isSearching]);

  const sortOptions: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
    { value: "trending", label: "Trending", icon: TrendingUp },
    { value: "newest", label: "Newest", icon: Clock },
    { value: "rating", label: "Top Rated", icon: Star },
  ];

  return (
    <section className={`bg-muted/30 ${showHeader ? 'py-20 md:py-28' : 'py-8 md:py-12'}`}>
      <div className="container mx-auto px-4">
        {showHeader && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
              Explore Prompts
            </h2>
            <p className="text-lg text-muted-foreground">
              Browse our curated collection of high-quality prompts. Copy instantly.
            </p>
          </div>
        )}

        {/* Search, Sort, and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort Options - disabled when searching */}
          <div className="flex justify-center gap-2">
            {sortOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={sortBy === value && !isSearching ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSortBy(value)}
                disabled={isSearching}
                className={cn(
                  "gap-1.5", 
                  sortBy === value && !isSearching && "font-medium",
                  isSearching && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
          {isSearching && (
            <p className="text-center text-sm text-muted-foreground">
              Showing results by relevance
            </p>
          )}
          
          <div className="flex justify-center">
            <CategoryFilter selected={category} onSelect={setCategory} />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="py-12 text-center">
            <p className="text-lg text-destructive">
              Failed to load prompts. Please try again later.
            </p>
          </div>
        )}

        {/* Prompts Grid */}
        {!isLoading && !error && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedPrompts.map((prompt, index) => (
              <div 
                key={prompt.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <PromptCard prompt={prompt} showAuthorInfo />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredAndSortedPrompts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No prompts found. Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
