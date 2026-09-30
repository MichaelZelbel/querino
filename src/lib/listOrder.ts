/**
 * Sort orders for lists that are fetched a page at a time.
 *
 * PostgREST pages with OFFSET and LIMIT, and each page is a separate query.
 * When the ORDER BY leaves rows tied, Postgres is free to put the tied rows in
 * a different order in every one of those queries, so "Load more" repeats some
 * rows and never shows others. Most prompts have no rating yet (rating_avg and
 * rating_count are both 0), and measured on 2026-09-30 the Top Rated tab paged
 * through the 128 public prompts showing only 80 of them, 48 of those twice.
 * Every paged order therefore ends in the primary key, which never ties.
 */

export interface OrderTerm {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

/** The last word on order: the primary key is unique, so no two rows tie. */
export const ID_TIEBREAK: OrderTerm = { column: "id", ascending: true };

/** `terms`, ending in the primary key unless it already does. */
export function withIdTiebreak(terms: readonly OrderTerm[]): OrderTerm[] {
  return terms.at(-1)?.column === ID_TIEBREAK.column
    ? [...terms]
    : [...terms, ID_TIEBREAK];
}

export type PromptBrowseSort = "trending" | "newest" | "rating";

/** The browse orders of the public prompt grid (Discover and the home page). */
export function promptBrowseOrder(sort: PromptBrowseSort): OrderTerm[] {
  switch (sort) {
    case "newest":
      return withIdTiebreak([{ column: "created_at", ascending: false }]);
    case "rating":
      return withIdTiebreak([
        { column: "rating_avg", ascending: false },
        { column: "rating_count", ascending: false },
        { column: "created_at", ascending: false },
      ]);
    case "trending":
    default:
      return withIdTiebreak([
        { column: "copies_count", ascending: false, nullsFirst: false },
        { column: "rating_avg", ascending: false },
        { column: "created_at", ascending: false },
      ]);
  }
}

interface Orderable<Q> {
  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean },
  ): Q;
}

/** Apply `terms` to a supabase-js query, in order. */
export function applyOrder<Q extends Orderable<Q>>(
  query: Q,
  terms: readonly OrderTerm[],
): Q {
  return terms.reduce(
    (q, { column, ascending, nullsFirst }) =>
      q.order(
        column,
        nullsFirst === undefined ? { ascending } : { ascending, nullsFirst },
      ),
    query,
  );
}
