// Discover's state lives in the address: /discover?type=skills&q=meeting&sort=rating&category=coding&tag=planning.
//
// It used to live in component state, so Back from a card lost the search, sort
// and category, and the Prompts tab kept a second copy of all three inside
// PromptsSection that a tab switch wiped (2026-09-30). One reader and one
// writer keep all four tabs on the same rules.

export const DISCOVER_TABS = [
  "prompts",
  "skills",
  "workflows",
  "kits",
] as const;
export type DiscoverTab = (typeof DISCOVER_TABS)[number];

export type DiscoverSort = "trending" | "newest" | "rating";

/** Prompts can be sorted by how often they were copied; the rest cannot. */
export function sortOptionsFor(tab: DiscoverTab): DiscoverSort[] {
  return tab === "prompts"
    ? ["trending", "newest", "rating"]
    : ["newest", "rating"];
}

export function defaultSortFor(tab: DiscoverTab): DiscoverSort {
  return tab === "prompts" ? "trending" : "newest";
}

export interface DiscoverState {
  tab: DiscoverTab;
  q: string;
  /** The sort this tab actually uses (a sort it lacks falls back to its default). */
  sort: DiscoverSort;
  category: string;
  tag: string;
}

export function readDiscoverParams(params: URLSearchParams): DiscoverState {
  const typeParam = params.get("type") ?? "";
  const tab = (DISCOVER_TABS as readonly string[]).includes(typeParam)
    ? (typeParam as DiscoverTab)
    : "prompts";
  const sortParam = params.get("sort") ?? "";
  const sort = (sortOptionsFor(tab) as string[]).includes(sortParam)
    ? (sortParam as DiscoverSort)
    : defaultSortFor(tab);
  return {
    tab,
    q: params.get("q") ?? "",
    sort,
    category: params.get("category") || "all",
    tag: params.get("tag") ?? "",
  };
}

/**
 * The address after a change. Values at their default are left out, so a
 * plain visit stays /discover. The sort is kept as asked even where the new
 * tab lacks it ("trending" on Skills), so switching back to Prompts restores it.
 */
export function writeDiscoverParams(
  prev: URLSearchParams,
  change: Partial<Omit<DiscoverState, "sort">> & { sort?: DiscoverSort },
): URLSearchParams {
  const next = new URLSearchParams(prev);
  const set = (key: string, value: string | undefined, isDefault: boolean) => {
    if (value === undefined) return;
    if (isDefault || value === "") next.delete(key);
    else next.set(key, value);
  };
  set("type", change.tab, change.tab === "prompts");
  set("q", change.q?.trim(), false);
  set("category", change.category, change.category === "all");
  set("tag", change.tag, false);
  if (change.sort !== undefined) {
    const tab = readDiscoverParams(next).tab;
    set("sort", change.sort, change.sort === defaultSortFor(tab));
  }
  return next;
}
