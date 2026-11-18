/**
 * Finding a profile by the name in its address (/u/<name>) when the address
 * spells the name in other letter case than the profile stores it (#25:
 * /u/michael answered 200 and /u/Michael 404). Kept apart from the loader,
 * which needs the Supabase client, so the rules can be tested.
 *
 * What the database allows: since migration 20260908231000 (section 21, "One
 * display name, one person") `profiles_display_name_unique_ci` is a unique
 * index on lower(display_name) for every non-empty name, and the rows that
 * collided were renamed before it was built. Two profiles can therefore not
 * differ only in case. The loader still decides without relying on that:
 *
 * 1. An exact match always wins, so a case-insensitive lookup can never show
 *    another person than the exact address would.
 * 2. Without one, exactly one name equal to the address ignoring case is a
 *    301 to that name's address, so a profile has one indexable URL.
 * 3. No such name, or more than one (which the index rules out), is a miss
 *    (404, noindex): the loader never guesses between two people.
 */

/**
 * The ILIKE pattern that matches `name` ignoring case. LIKE's own wildcards
 * and its escape character are escaped. PostgREST reads `*` in a like pattern
 * as `%` and offers no escape for it, so a `*` becomes `_` (any one
 * character); that can only widen the candidates, and sameNameIgnoringCase
 * then keeps the true matches.
 */
export function caseInsensitiveNamePattern(name: string): string {
  let out = "";
  for (const char of name) {
    if (char === "\\" || char === "%" || char === "_") out += "\\" + char;
    else if (char === "*") out += "_";
    else out += char;
  }
  return out;
}

/** True when the two names are equal ignoring letter case. */
export function sameNameIgnoringCase(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * The one stored name the address names ignoring case, or null when none or
 * more than one does. `candidates` are the stored names the ILIKE query
 * returned; the address itself is not among them when an exact match was
 * already looked for and missed, but an exact match here is still taken as
 * the answer.
 */
export function pickNameIgnoringCase(
  address: string,
  candidates: readonly (string | null)[],
): string | null {
  const names = candidates.filter(
    (name): name is string => !!name && sameNameIgnoringCase(name, address),
  );
  if (names.includes(address)) return address;
  const distinct = [...new Set(names)];
  return distinct.length === 1 ? distinct[0] : null;
}
