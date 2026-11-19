/**
 * The sitemap and the RSS feed, built from the database.
 *
 * Ported from supabase/functions/api/index.ts, which served both from a Supabase edge
 * function on a foreign host while a Cloudflare rewrite proxied /sitemap.xml back onto
 * querino.ai and corrected its content type on the way. Three hops, one of them a
 * dashboard setting nobody could review, and /rss.xml was advertised on every blog page
 * while returning 404 on every URL the site named.
 *
 * The output is a deliberate copy of what the edge function produced, not an improvement
 * on it, so the move can be verified by comparing the two byte for byte. The one thing
 * that did change is the feed's own <atom:link>, which used to point at /api/rss.xml —
 * a URL that 404s. It now names the path this file is actually served from.
 *
 * The queries use the anon client, so row-level security applies. That is the point: the
 * sitemap must only list what a logged-out visitor can actually open.
 */

import { supabase } from "@/integrations/supabase/client";
import { SITE_ORIGIN } from "@/lib/seo";
import {
  ARTIFACT_TABLES,
  rssQuery,
  sitemapPageQuery,
  type SitemapSource,
} from "@/lib/publicArtifacts";
import {
  buildRssXml,
  RSS_ITEM_LIMIT,
  rssItems,
  type RssRow,
  type RssSource,
} from "@/lib/rssFeed";
import {
  buildSitemapXml,
  SITEMAP_SOURCES,
  type SitemapRow,
  type StaticPage,
} from "@/lib/sitemapXml";

/** How long a crawler may reuse a response. Carried over from the edge function. */
export const FEED_CACHE_CONTROL = "public, max-age=3600";

/**
 * The feed of what Querino publishes (rssFeed.ts builds the XML). Until
 * 2026-11 it was a blog-only feed titled "Querino Blog", empty because there
 * are no posts; the owner chose a feed of the public artifacts (#9, #44).
 */
export async function buildRss(): Promise<string> {
  const tables = [...ARTIFACT_TABLES, "blog_posts"] as const;
  const results = await Promise.all(
    tables.map((table) =>
      rssQuery(supabase.from(table), table, RSS_ITEM_LIMIT),
    ),
  );

  const sources: Partial<Record<RssSource, RssRow[]>> = {};
  results.forEach(({ data, error }, i) => {
    if (error) {
      // A feed reader retries a 500, but silently accepts an empty or short
      // channel as "nothing new was published".
      throw new Error(`RSS query for ${tables[i]} failed: ${error.message}`);
    }
    sources[tables[i]] = (data ?? []) as unknown as RssRow[];
  });

  return buildRssXml(SITE_ORIGIN, rssItems(SITE_ORIGIN, sources));
}

/** One page of rows, and the cap PostgREST applies whether or not you ask. */
const SITEMAP_PAGE = 1000;

/**
 * Every published row of one table, in pages.
 *
 * PostgREST answers with at most 1000 rows and reports no error when it
 * truncates, so the single unpaged select this replaces silently stopped
 * listing anything past the thousandth artifact. A sitemap that quietly goes
 * short is worse than one that fails: nobody finds out, the pages just stop
 * being crawled.
 */
async function fetchAllRows(
  table: SitemapSource,
): Promise<{ data: SitemapRow[] | null; error: { message: string } | null }> {
  const rows: SitemapRow[] = [];

  for (let from = 0; ; from += SITEMAP_PAGE) {
    const { data, error } = await sitemapPageQuery(
      supabase.from(table),
      table,
      from,
      from + SITEMAP_PAGE - 1,
    );

    if (error) return { data: null, error };
    const page = (data ?? []) as SitemapRow[];
    rows.push(...page);
    if (page.length < SITEMAP_PAGE) break;
  }

  return { data: rows, error: null };
}

export async function buildSitemap(): Promise<string> {
  // Static pages with their priorities
  const staticPages: StaticPage[] = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/discover", priority: "0.9", changefreq: "daily" },
    // The plain link lists. They are how a crawler that ignores the sitemap still
    // reaches every public artefact from the footer of any page.
    { loc: "/prompts", priority: "0.8", changefreq: "daily" },
    { loc: "/skills", priority: "0.8", changefreq: "daily" },
    { loc: "/workflows", priority: "0.8", changefreq: "daily" },
    { loc: "/docs", priority: "0.5", changefreq: "monthly" },
    { loc: "/community-guidelines", priority: "0.3", changefreq: "yearly" },

    // /auth intentionally excluded — login pages should not be advertised for indexing
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
    { loc: "/impressum", priority: "0.3", changefreq: "yearly" },
  ];

  // Fetch dynamic content in parallel
  const results = await Promise.all(
    SITEMAP_SOURCES.map(({ table }) => fetchAllRows(table)),
  );

  // Same reasoning as the RSS feed and as fetchAllRows: a crawler retries a
  // 500, but takes a sitemap missing a whole table at its word and drops those
  // pages from the index. Until 2026-09-16 a failed query here skipped its table
  // silently, which is exactly what the comment above fetchAllRows says must
  // not happen.
  const rows: Partial<Record<SitemapSource, SitemapRow[]>> = {};
  results.forEach(({ data, error }, i) => {
    const { table } = SITEMAP_SOURCES[i];
    if (error) {
      throw new Error(`Sitemap query for ${table} failed: ${error.message}`);
    }
    rows[table] = data ?? [];
  });

  // /blog is only advertised once there is a published post to read; an empty
  // blog index is a thin page a crawler should not be sent to.
  if ((rows.blog_posts?.length ?? 0) > 0) {
    staticPages.push({ loc: "/blog", priority: "0.8", changefreq: "daily" });
  }

  return buildSitemapXml(SITE_ORIGIN, staticPages, rows);
}
