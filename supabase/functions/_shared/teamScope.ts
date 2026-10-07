// Which of an author's own artifacts they may still edit (7 October 2026).
//
// On the website, the UPDATE policy "Users can update their own <artifact>"
// on prompts, skills, workflows and prompt_kits lets the author write a row
// only while its team_id IS NULL or names a team the author is a member of
// (its WITH CHECK). The other UPDATE policy needs team membership too, so an
// author who has left a team, or was removed from it when their Premium
// lapsed, can no longer change that team's artifacts there.
//
// mcp-server holds the service-role key, which bypasses row-level security,
// and its update tools checked author_id alone. An MCP token minted while the
// author was a member therefore kept rewriting and publishing the team's
// artifacts after they were removed. The condition below is the policy's,
// for the MCP server to add to every update, built in one place so the four
// tools cannot drift apart.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A PostgREST `or` filter for "team_id IS NULL OR team_id IN (teamIds)", to
 * pass to `.or()`. With no teams it is "team_id IS NULL" alone, so a caller
 * who belongs to no team can edit only their personal artifacts.
 *
 * Anything that is not a uuid is dropped rather than pasted in: the ids come
 * from team_members, but a comma or a parenthesis in this string would be
 * filter syntax, and dropping an id can only narrow what is editable.
 */
export function editableTeamFilter(teamIds: readonly unknown[]): string {
  const ids = [
    ...new Set(
      teamIds.filter(
        (id): id is string => typeof id === "string" && UUID_RE.test(id),
      ),
    ),
  ];
  return ids.length === 0
    ? "team_id.is.null"
    : `team_id.is.null,team_id.in.(${ids.join(",")})`;
}
