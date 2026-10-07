// A top-level comment that has replies is not deleted but blanked to this
// exact text (2026-10-07). comments.parent_id cascades on delete, so deleting
// it used to delete every reply other people had written under it, while the
// dialog said only "your comment". The database skips moderation for exactly
// this text, so blanking cannot be refused as an edit would be.

export const DELETED_COMMENT_TEXT = "[This comment was deleted by its author.]";

export function isDeletedComment(comment: { content: string }): boolean {
  return comment.content === DELETED_COMMENT_TEXT;
}

/** Comments and replies a reader can still read; placeholders do not count. */
export function countReadableComments(
  comments: ReadonlyArray<{ content: string; replies?: { content: string }[] }>,
): number {
  let n = 0;
  for (const c of comments) {
    if (!isDeletedComment(c)) n++;
    for (const r of c.replies ?? []) if (!isDeletedComment(r)) n++;
  }
  return n;
}
