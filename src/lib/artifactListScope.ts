/**
 * Which rows an artifact list asks for (see useArtifactList). Kept apart from
 * the hook, which needs the Supabase client, so it can be tested on its own.
 */
export interface ArtifactListScope {
  published?: boolean;
  authorId?: string;
  teamId?: string;
}

/**
 * True when the list names what it wants: the public catalogue, one author's
 * rows or one team's.
 *
 * A list with none of the three is every row the caller may read, with no
 * limit. No page wants that. It is what the Library asked for in the moment
 * before the signed-in user was known (`authorId: user?.id` was still
 * undefined), and it downloaded every published skill, workflow and kit,
 * content included, on each visit before asking again for the right rows.
 */
export function hasArtifactListScope(scope: ArtifactListScope): boolean {
  return (
    scope.published !== undefined || Boolean(scope.authorId || scope.teamId)
  );
}
