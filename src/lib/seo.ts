/**
 * Builds a TanStack Router `head()` payload.
 *
 * This replaces what SEOHead did from a useEffect. The difference is not cosmetic: a
 * useEffect runs only after React has hydrated in a browser, so a crawler that does not
 * execute JavaScript saw none of it. Measured before this existed, all 53 routes served
 * one title, no canonical link, and no page-specific structured data.
 *
 * The rules below are copied from SEOHead deliberately, not improved, so the metadata a
 * person sees after hydration and the metadata a crawler sees in the HTML are the same
 * text. migration/seo-inventory.json is the record of what that text was.
 */

const SITE_NAME = "Querino";
const DEFAULT_DESCRIPTION =
  "Discover and share AI prompts, skills, and workflows.";
const DEFAULT_OG_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";

// The canonical origin. Unlike the browser-side helper in src/config/site.ts this never
// asks the window, because a canonical URL that depends on which host served the page is
// how a preview deployment ends up publishing canonicals pointing at itself.
export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN?.replace(/\/+$/, "") || "https://querino.ai";

export interface PageHead {
  /** Page title without the site name; the suffix is added the way SEOHead added it. */
  title: string;
  description?: string | null;
  /** Path or absolute URL. A path is resolved against SITE_ORIGIN. */
  canonical?: string | null;
  ogType?: "website" | "article";
  ogImage?: string | null;
  publishedTime?: string | null;
  author?: string | null;
  noIndex?: boolean;
  rss?: boolean;
  /** One structured-data block, or several. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
}

const absolute = (url: string) =>
  url.startsWith("http")
    ? url
    : `${SITE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;

export function pageHead(page: PageHead) {
  const fullTitle = page.title.includes(SITE_NAME)
    ? page.title
    : `${page.title} | ${SITE_NAME}`;
  const description = page.description || DEFAULT_DESCRIPTION;
  const ogImage = page.ogImage || DEFAULT_OG_IMAGE;
  const canonical = page.canonical ? absolute(page.canonical) : null;

  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: page.ogType ?? "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];

  if (canonical) meta.push({ property: "og:url", content: canonical });
  if (page.noIndex) meta.push({ name: "robots", content: "noindex, nofollow" });
  if (page.ogType === "article") {
    if (page.publishedTime)
      meta.push({
        property: "article:published_time",
        content: page.publishedTime,
      });
    if (page.author)
      meta.push({ property: "article:author", content: page.author });
  }

  const links: Array<Record<string, string>> = [];
  if (canonical) links.push({ rel: "canonical", href: canonical });
  if (page.rss) {
    links.push({
      rel: "alternate",
      type: "application/rss+xml",
      title: `${SITE_NAME} Blog RSS Feed`,
      href: `${SITE_ORIGIN}/rss.xml`,
    });
  }

  const blocks = page.jsonLd ? [page.jsonLd].flat() : [];
  const scripts = blocks.map((block) => ({
    type: "application/ld+json",
    children: JSON.stringify(block),
  }));

  return { meta, links, scripts };
}

/**
 * A page that must never be indexed: everything behind sign-in, every editor, every
 * admin screen. They still get a real title, because a browser tab and a bookmark are
 * worth as much on a private page as on a public one.
 */
export function privateHead(title: string) {
  return pageHead({ title, noIndex: true });
}

/** Structured data for one artefact, matching what the detail pages already emitted. */
export function creativeWorkJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  author?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  genre?: string | null;
  inLanguage?: string | null;
}) {
  const block: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.name,
    url: absolute(input.url),
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    // No aggregateRating: Google only allows ratings on specific types (Product, Book,
    // and so on). On a generic CreativeWork it is a hard "Invalid object type" error in
    // Search Console. The note is carried over from the component this replaces.
  };
  block.headline = input.name;
  block.inLanguage = input.inLanguage || "en";
  if (input.genre) block.genre = input.genre;
  if (input.description) block.description = input.description;
  if (input.author) block.author = { "@type": "Person", name: input.author };
  if (input.datePublished) block.datePublished = input.datePublished;
  if (input.dateModified) block.dateModified = input.dateModified;
  return block;
}
