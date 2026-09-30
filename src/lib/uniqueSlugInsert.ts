// The slug a New page sends comes from the `generate-slug` function, which
// transliterates the title but cannot know which slugs are taken (private rows
// are invisible to the caller). The database only makes a slug unique when none
// is sent, so a second "Code Review" by anyone failed with a duplicate key.
// This keeps the transliterated slug and walks -2, -3, ... on a collision.

type SlugError = { code?: string; message?: string } | null;

export function isSlugCollision(error: SlugError): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  // 23505: unique_violation on the slug index, and also what the trigger
  // refuse_redirect_slug_takeover raises ('The slug "x" still redirects to
  // another prompt') when the slug is another artifact's old address.
  // P0001 is the plain RAISE code, kept in case the trigger loses its ERRCODE.
  return (
    (error.code === "23505" && message.includes("slug")) ||
    (error.code === "P0001" && message.includes("still redirects"))
  );
}

export async function insertWithUniqueSlug<R extends { error: SlugError }>(
  baseSlug: string,
  insert: (slug: string | null) => PromiseLike<R>,
  maxAttempts = 8,
): Promise<R> {
  for (let attempt = 1; attempt <= maxAttempts && baseSlug; attempt++) {
    const result = await insert(
      attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`,
    );
    if (!isSlugCollision(result.error)) return result;
  }
  // No slug, or still colliding: the database picks a free one from the title.
  return insert(null);
}
