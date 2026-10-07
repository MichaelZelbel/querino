// The page number of a public blog list from its ?page= parameter.
//
// parseInt("abc") is NaN, and a NaN page asked the database for rows NaN to
// NaN: the list said "No posts yet" with no pager and no way back
// (2026-10-07). Anything that is not a whole number of at least 1 is page 1.
export function parseBlogPage(raw: string | null | undefined): number {
  const n = Number(raw ?? "1");
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
