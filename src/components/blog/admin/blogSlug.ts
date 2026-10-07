// Which slug the blog editor sends with a save (2026-10-07).
//
// The editor used to fill the slug from the title and always send the slug it
// had loaded, so the database trigger and the form disagreed about a post's
// address and each save could move it. Now a slug is sent only when the admin
// typed one: a new post sends null and the trigger makes a unique slug from
// the title; an existing post leaves the key out and keeps its address. After
// every save the editor shows the slug the database actually stored.

/** A typed slug as an address: lower case letters, digits and single hyphens. */
export function cleanBlogSlug(input: string): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The slug part of a save payload. `{ slug: null }` lets the database choose;
 * `{}` leaves the stored slug alone.
 *
 * Nothing but the admin writes the slug field, so a new post's field is empty
 * unless typed in, and an existing post's field holds the stored slug unless
 * the admin changed it. An untouched stored slug is never "cleaned" into a new
 * address.
 */
export function slugForSave(opts: {
  isNew: boolean;
  formSlug: string;
  /** The slug the database holds for this post, if it exists. */
  savedSlug: string | null;
}): { slug?: string | null } {
  const clean = cleanBlogSlug(opts.formSlug);
  if (opts.isNew) return { slug: clean || null };
  if (clean && opts.formSlug.trim() !== opts.savedSlug) return { slug: clean };
  return {};
}
