// What the Discussion section offers, mirroring the two insert rules on
// public.comments: anyone signed in may comment on a public item, and a team's
// members may comment on the team's items. A private item that belongs to no
// team takes no comments at all, not even from its author, so the box that
// used to be shown there ran a moderation call and then put the raw
// "violates row-level security policy" error on screen (2026-09-30).

export type CommentAccess =
  /** Show the comment box. */
  | "open"
  /** Show the list and a "sign in to comment" note. */
  | "sign-in"
  /** Show a note that comments open once the item is published. */
  | "private"
  /** Render nothing. */
  | "hidden";

export function commentAccess(opts: {
  /** undefined when the caller does not know; treated as public. */
  isPublic?: boolean | null;
  teamId?: string | null;
  signedIn: boolean;
}): CommentAccess {
  const { isPublic, teamId, signedIn } = opts;
  if (teamId) return signedIn ? "open" : "hidden";
  if (isPublic === false) return "private";
  return signedIn ? "open" : "sign-in";
}
