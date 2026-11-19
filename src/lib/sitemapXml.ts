/**
 * The sitemap's XML, from rows already fetched (feeds.ts fetches them).
 *
 * Kept apart from feeds.ts, which needs the Supabase client, so a test can
 * build a sitemap from fixture rows and read what it lists.
 */
import { collectionPath } from "@/lib/collectionHead.ts";
import type { SitemapSource } from "@/lib/publicArtifacts.ts";
import { escapeXml } from "@/lib/rssFeed.ts";

/** What the sitemap query selects of one row: a slug, or for a collection its id. */
export interface SitemapRow {
  slug?: string | null;
  id?: string | null;
  updated_at: string | null;
}

export interface StaticPage {
  loc: string;
  priority: string;
  changefreq: string;
}

/** Every source in the order its entries appear, with its priority. */
export const SITEMAP_SOURCES = [
  { table: "blog_posts", priority: "0.7" },
  { table: "prompts", priority: "0.6" },
  { table: "skills", priority: "0.6" },
  { table: "workflows", priority: "0.6" },
  { table: "prompt_kits", priority: "0.6" },
  { table: "collections", priority: "0.5" },
] as const satisfies readonly { table: SitemapSource; priority: string }[];

const SLUG_PREFIX = {
  blog_posts: "/blog",
  prompts: "/prompts",
  skills: "/skills",
  workflows: "/workflows",
  prompt_kits: "/prompt-kits",
} as const;

/**
 * Where one row's page lives, or null for a row without an address. A
 * collection's is the canonical its own page states (collectionPath).
 */
export function sitemapPath(
  table: SitemapSource,
  row: SitemapRow,
): string | null {
  if (table === "collections") {
    return row.id ? collectionPath(escapeXml(row.id)) : null;
  }
  return row.slug ? `${SLUG_PREFIX[table]}/${escapeXml(row.slug)}` : null;
}

/** Sitemap <lastmod> wants a date, not a timestamp. */
function formatDate(isoDate: string): string {
  return isoDate.split("T")[0];
}

export function buildSitemapXml(
  origin: string,
  staticPages: readonly StaticPage[],
  rows: Partial<Record<SitemapSource, readonly SitemapRow[]>>,
  now: Date = new Date(),
): string {
  const urls: string[] = [];

  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${origin}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Every source is the same entry with a different address and priority.
  for (const { table, priority } of SITEMAP_SOURCES) {
    for (const row of rows[table] ?? []) {
      const path = sitemapPath(table, row);
      if (!path) continue;
      const lastmod = formatDate(row.updated_at ?? now.toISOString());
      urls.push(`
  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;
}
