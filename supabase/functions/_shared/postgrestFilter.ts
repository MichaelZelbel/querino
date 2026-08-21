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
