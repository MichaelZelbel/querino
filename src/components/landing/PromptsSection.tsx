import { useState, useMemo } from "react";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CategoryFilter } from "@/components/prompts/CategoryFilter";
import { usePrompts } from "@/hooks/usePrompts";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PromptsSectionProps {
  showHeader?: boolean;
}

export function PromptsSection({ showHeader = true }: PromptsSectionProps) {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: prompts, isLoading, error } = usePrompts();

  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];
    
    return prompts.filter((prompt) => {
      const matchesCategory = category === "all" || prompt.category === category;
      const matchesSearch = 
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);
      return matchesCategory && matchesSearch;
    });
  }, [prompts, category, searchQuery]);

  return (
    <section className="bg-muted/30 py-20 md:py-28">
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

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
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
            {filteredPrompts.map((prompt, index) => (
              <div 
                key={prompt.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <PromptCard prompt={prompt} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredPrompts.length === 0 && (
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
