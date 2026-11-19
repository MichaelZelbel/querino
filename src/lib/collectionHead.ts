// The part of seo.ts's PageHead this page sets. Declared here, not imported:
// the Deno unit tests type-check every import, and seo.ts reads
// import.meta.env, which only exists under Vite.
export interface CollectionPageHead {
  title: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

/**
 * What one collection's page says about itself, for pageHead().
 *
 * A public collection is a public page like a prompt's: its own title,
 * description, og tags and canonical, and indexable. It used to be noindex with
 * the site's generic description, so crawlers and link previews got nothing. A
 * private collection (only its owner gets it, in the browser) stays noindex,
 * and a miss is the not-found page.
 */
export function collectionPage(
  collection:
    | {
        id: string;
        title: string;
        description?: string | null;
        is_public?: boolean | null;
      }
    | null
    | undefined,
): CollectionPageHead {
  if (!collection) return { title: "Collection Not Found", noIndex: true };
  if (!collection.is_public) return { title: collection.title, noIndex: true };
  return {
    title: collection.title,
    description:
      collection.description?.trim() ||
      `${collection.title}, a collection of AI prompts, skills and workflows on Querino`,
    canonical: `/collections/${collection.id}`,
  };
}
