// The numbers on the rating card, and whether it offers stars to click.

/**
 * The average and count the rating card shows. Once the reviews have loaded
 * they are the source: the item's own rating_avg / rating_count come from the
 * copy of the item the page loaded, which a new or deleted review does not
 * refresh. Rating something left "No ratings yet" above your own new review,
 * and deleting the last review left "4.0 /5, 1 review" above an empty list
 * (2026-09-30). Every review of a public item is readable by everyone, so the
 * loaded list is complete. While it loads, the item's numbers stand in, which
 * is also what the server rendered.
 */
export function reviewSummary(
  reviews: ReadonlyArray<{ rating: number }>,
  loading: boolean,
  fallback: {
    avg: number | null | undefined;
    count: number | null | undefined;
  },
): { avg: number; count: number } {
  if (loading) {
    return {
      avg: Number(fallback.avg || 0),
      count: Number(fallback.count || 0),
    };
  }
  const count = reviews.length;
  const avg = count
    ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count
    : 0;
  return { avg, count };
}

/**
 * Whether the stars can be clicked. Every reviews table accepts a review only
 * for a public item (is_item_public in its insert rule), so on a private one
 * the stars led to "Failed to submit review" after a click.
 */
export function ratingMode(opts: {
  signedIn: boolean;
  /** undefined when the caller does not know; treated as public. */
  isPublic?: boolean | null;
}): "rate" | "sign-in" | "closed" {
  if (opts.isPublic === false) return "closed";
  return opts.signedIn ? "rate" : "sign-in";
}
