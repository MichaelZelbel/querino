// Building a PostgREST filter by pasting a search box straight into a string
// is finding M2 of the August 2026 audit. `.or("title.ilike.%a,b%")` puts the
// user's comma into the middle of a comma-separated list of filters, PostgREST
// answers "failed to parse logic tree", and every caller in this repository
// destructured `{ data }` without looking at `error`, so the user saw an empty
// result and concluded there was nothing there.
//
// This file is the one place that escaping happens. The frontend re-exports it
// from src/lib/postgrestFilter.ts so there is a single implementation rather
// than one per call site.
//
// ---------------------------------------------------------------------------
// Why the backslash counts below look strange
// ---------------------------------------------------------------------------
//
// A search term crosses TWO unescaping layers before PostgreSQL sees it, and
// each one eats a backslash:
//
//   raw filter text
//     -> PostgREST's quoted-value parser   (turns \X into X, for ANY X)
//     -> PostgreSQL's LIKE/ILIKE matcher   (turns \X into a literal X)
//     -> the comparison
//
// So a backslash that must survive to the ILIKE pattern has to be written four
// times, and a wildcard that must stop being a wildcard has to be written with
// two backslashes in front of it. This was measured against the live project
// on 21 August 2026, not inferred from documentation:
//
//   sent                       matched
//   "%\%%"      (1 backslash)  every row          <- PostgREST ate the backslash
//   "%\\%%"     (2)            only rows with a literal %
//   "%\\\\%%"   (4)            only rows with a literal backslash
//   "%back\\"   (2, trailing)  error: LIKE pattern must not end with escape character
//
// Double quotes around the whole value are what stops PostgREST reading the
// user's , ( ) and . as filter syntax. Inside the quotes only " and \ still
// mean anything to PostgREST, and both are handled below.

const BACKSLASH = String.fromCharCode(92);

/**
 * Escape a user-supplied string so it can sit inside a double-quoted PostgREST
 * filter value and be matched literally by ILIKE.
 *
 * The caller wraps the result in quotes and adds its own wildcards; see
 * {@link ilikeContains}.
 */
export function escapeFilterValue(input: string): string {
  let out = "";

  for (const char of input) {
    switch (char) {
      // Survives both layers: 4 raw -> 2 after PostgREST -> 1 literal backslash.
      case BACKSLASH:
        out += BACKSLASH.repeat(4);
        break;

      // Wildcards. 2 raw backslashes -> 1 after PostgREST -> ILIKE reads the
      // next character literally.
      case "%":
      case "_":
        out += BACKSLASH.repeat(2) + char;
        break;

      // PostgREST's quoted-value parser is the only layer that cares about a
      // double quote, so one backslash is exactly right. Two would leave a
      // stray backslash in the pattern.
      case '"':
        out += BACKSLASH + '"';
        break;

      // PostgREST rewrites * to % as a URL-friendly wildcard, and it does that
      // AFTER unquoting, so a literal asterisk cannot be expressed through the
      // ilike operator at all. Measured: "%star\\*mark%" matches rows with a
      // literal %, not rows with a literal *.
      //
      // The closest representable thing is _, which matches exactly one
      // character. Searching for "star*mark" then finds "star*mark" (and, at
      // worst, "starXmark") instead of everything between "star" and "mark".
      case "*":
        out += "_";
        break;

      // , ( ) . : and everything else are inert once the value is quoted.
      default:
        out += char;
    }
  }

  return out;
}

/**
 * One `column.ilike."%term%"` filter term, safe for any user input.
 *
 * The wildcards are added outside {@link escapeFilterValue} on purpose: those
 * two are ours and must keep working as wildcards.
 */
export function ilikeContains(column: string, term: string): string {
  return `${column}.ilike."%${escapeFilterValue(term)}%"`;
}

/**
 * The whole `or(...)` expression for "this term appears in any of these
 * columns". Pass the result straight to supabase-js `.or()`.
 */
export function orIlikeContains(columns: readonly string[], term: string): string {
  return columns.map((column) => ilikeContains(column, term)).join(",");
}

/**
 * "Mine, or one of my teams'", as an `or(...)` expression.
 *
 * Finding M3: with no teams, `team_id.in.()` is a syntax error that fails the
 * whole query, and the swallowed error made it look like the user simply owned
 * nothing. With an empty list the clause is left out entirely.
 *
 * The ids are UUIDs from the session and the workspace context rather than
 * anything typed, so they are not escaped, but they are still quoted so a
 * malformed one cannot reshape the filter.
 */
export function ownedByUserOrTeams(
  userIdColumn: string,
  userId: string,
  teamIdColumn: string,
  teamIds: readonly string[],
): string {
  const mine = `${userIdColumn}.eq.${userId}`;
  if (teamIds.length === 0) return mine;
  const list = teamIds.map((id) => `"${escapeFilterValue(id)}"`).join(",");
  return `${mine},${teamIdColumn}.in.(${list})`;
}

// ---------------------------------------------------------------------------
// Multi-word search
// ---------------------------------------------------------------------------
//
// August 2026, reported from a Claude Code session: `search_skills` was asked
// for "alamops implement orchestrator" and returned nothing, while the skill
// it was looking for is titled "Implement (alamops): eight-phase feature
// orchestrator, kept dormant". All three words are in the title. The session
// concluded the record did not exist, and then that private records must be
// invisible to search.
//
// Neither was true. The whole query string was being pasted into ONE
// `%...%` pattern, so a multi-word search only ever matched when those words
// appeared side by side, in that order, in a single column. One word worked,
// two words usually did not, and the failure looked exactly like an empty
// library.
//
// That is the same shape of harm as finding M2 above: a search that answers
// "nothing" when it means "I did not understand the question". An agent
// cannot tell those apart, so it reports the absence as fact.
//
// The fix is to treat the query as words. Each word gets its own filter, and
// a row has to satisfy all of them; see {@link allTermsFilters}.

/** Words past this are ignored. Dropping a word only ever widens the result
 *  set, so a long query degrades into a looser search rather than a wrong
 *  "nothing found". */
const MAX_SEARCH_TERMS = 8;

/**
 * Split a search query into terms.
 *
 * Whitespace separates words. A "quoted phrase" stays one term, which is how
 * a caller asks for the old side-by-side behaviour on purpose.
 *
 * Returns an empty array for a blank query; callers then apply no search
 * filter at all rather than matching the empty string.
 */
export function tokenizeSearchQuery(query: string): string[] {
  const terms: string[] = [];
  const pattern = /"([^"]*)"|(\S+)/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(query)) !== null) {
    const term = (match[1] ?? match[2] ?? "").trim();
    if (term) terms.push(term);
    if (terms.length >= MAX_SEARCH_TERMS) break;
  }

  return terms;
}

/**
 * "Every word appears somewhere in these columns", as one `or(...)` expression
 * per word.
 *
 * PostgREST ANDs repeated top-level query parameters, and supabase-js appends
 * rather than replaces on each `.or()` call, so chaining these gives
 * (word1 in any column) AND (word2 in any column) AND ...
 *
 *   let q = sb.from("skills").select("*").eq("author_id", id);
 *   for (const f of allTermsFilters(SEARCH_COLUMNS, query)) q = q.or(f);
 */
export function allTermsFilters(columns: readonly string[], query: string): string[] {
  return tokenizeSearchQuery(query).map((term) => orIlikeContains(columns, term));
}

/**
 * "Any word appears somewhere in these columns", as a single `or(...)`
 * expression.
 *
 * This is the second chance after {@link allTermsFilters} finds nothing. A
 * caller that asked for four words and owns something matching three of them
 * is better served by that near miss than by an empty list it will read as
 * proof the thing does not exist.
 *
 * Returns an empty string when there is nothing to search for; callers should
 * skip the query rather than send `or=()`, which is a parse error.
 */
export function anyTermFilter(columns: readonly string[], query: string): string {
  return tokenizeSearchQuery(query)
    .flatMap((term) => columns.map((column) => ilikeContains(column, term)))
    .join(",");
}
