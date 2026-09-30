import { allTermsFilters } from "@/lib/postgrestFilter.ts";

/**
 * Partial matching, for when whole-word search finds nothing (2026-09-30).
 *
 * Full-text search matches whole words: "summar" found no public prompt while
 * 14 contain "summarize" or "summary". When it finds nothing, the lists ask
 * again with every word as a fragment that must appear somewhere in the title,
 * the description or the text. Escaping is the shared helper's, so a comma or
 * a quote in the search box cannot break the filter (finding M2, 2026-08-20).
 */
export const PARTIAL_MATCH_COLUMNS = ["title", "description", "content"];

interface OrFilterable<Q> {
  or(filters: string): Q;
}

/** `query` narrowed to rows containing every word of `text` as a fragment. */
export function withPartialMatch<Q extends OrFilterable<Q>>(
  query: Q,
  text: string,
): Q {
  return allTermsFilters(PARTIAL_MATCH_COLUMNS, text).reduce(
    (q, filter) => q.or(filter),
    query,
  );
}
