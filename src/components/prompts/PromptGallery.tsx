import { useState, useMemo } from "react";
import { Prompt } from "@/types/prompt";
import { PromptCard } from "./PromptCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PromptGalleryProps {
    prompts: Prompt[];
}

export function PromptGallery({ prompts }: PromptGalleryProps) {
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("top_rated");
    const [search, setSearch] = useState("");

    const categories = Array.from(new Set(prompts.map(p => p.category)));

    const filteredAndSortedPrompts = useMemo(() => {
        let result = [...prompts];

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(lowerSearch) ||
                p.description.toLowerCase().includes(lowerSearch)
            );
        }

        // Filter by Category
        if (filter !== "all") {
            result = result.filter(p => p.category === filter);
        }

        // Sort
        switch (sort) {
            case "top_rated":
                result.sort((a, b) => b.rating_avg - a.rating_avg);
                break;
            case "trending":
                // Mock trending sort: prioritize items marked 'is_trending' then rating
                result.sort((a, b) => (Number(b.is_trending) - Number(a.is_trending)) || (b.rating_avg - a.rating_avg));
                break;
            case "newest":
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }

        return result;
    }, [prompts, filter, sort, search]);

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg shadow-sm border">
                {/* Search */}
                <div className="w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Category Filter */}
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[180px]" aria-label="Category">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="w-[180px]" aria-label="Sort By">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="top_rated">Top Rated</SelectItem>
                            <SelectItem value="trending">Trending</SelectItem>
                            <SelectItem value="newest">Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedPrompts.map(prompt => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                ))}
            </div>

            {filteredAndSortedPrompts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No prompts found matching your criteria.
                </div>
            )}
        </div>
    );
}
