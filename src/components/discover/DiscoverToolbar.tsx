import { Search, TrendingUp, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryOptions } from "@/types/prompt";
import {
  sortOptionsFor,
  type DiscoverSort,
  type DiscoverTab,
} from "./discoverParams";

const SORT_LABELS: Record<
  DiscoverSort,
  { label: string; icon: typeof TrendingUp }
> = {
  trending: { label: "Trending", icon: TrendingUp },
  newest: { label: "Newest", icon: Clock },
  rating: { label: "Top Rated", icon: Star },
};

const SEARCH_PLACEHOLDER: Record<DiscoverTab, string> = {
  prompts: "Search prompts...",
  skills: "Search skills...",
  workflows: "Search workflows...",
  kits: "Search prompt kits...",
};

const SEARCH_LABEL: Record<DiscoverTab, string> = {
  prompts: "Search prompts",
  skills: "Search skills",
  workflows: "Search workflows",
  kits: "Search prompt kits",
};

interface DiscoverToolbarProps {
  tab: DiscoverTab;
  search: string;
  onSearchChange: (value: string) => void;
  sort: DiscoverSort;
  onSortChange: (sort: DiscoverSort) => void;
  /** While a search is active, results are ranked by relevance, not sorted. */
  isSearching: boolean;
  category: string;
  onCategoryChange: (category: string) => void;
  tag: string;
  onClearTag: () => void;
  /** A line under the controls, e.g. how search results are ranked. */
  note?: string | null;
}

/**
 * The one toolbar all four Discover tabs share: search, sort, category and
 * the active tag. The Prompts tab used to bring its own (a grey band, pill
 * buttons for categories, its tag chip below instead of above), so the four
 * tabs looked and behaved like two different pages.
 */
export function DiscoverToolbar({
  tab,
  search,
  onSearchChange,
  sort,
  onSortChange,
  isSearching,
  category,
  onCategoryChange,
  tag,
  onClearTag,
  note,
}: DiscoverToolbarProps) {
  return (
    <div className="space-y-4">
      {tag && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtered by tag:</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            #{tag}
          </span>
          <button
            type="button"
            onClick={onClearTag}
            className="rounded-sm text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear
          </button>
        </div>
      )}
      <div className="relative mx-auto max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={SEARCH_PLACEHOLDER[tab]}
          aria-label={SEARCH_LABEL[tab]}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sortOptionsFor(tab).map((value) => {
          const { label, icon: Icon } = SORT_LABELS[value];
          const active = sort === value && !isSearching;
          return (
            <Button
              key={value}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSortChange(value)}
              disabled={isSearching}
              aria-pressed={active}
              className="gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          );
        })}
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {note && (
        <p className="text-center text-sm text-muted-foreground">{note}</p>
      )}
    </div>
  );
}
