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

/** How long a crawler may reuse a response. Carried over from the edge function. */
export const FEED_CACHE_CONTROL = "public, max-age=3600";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Sitemap <lastmod> wants a date, not a timestamp. */
function formatDate(isoDate: string): string {
  return isoDate.split("T")[0];
}

export async function buildRss(): Promise<string> {
  const siteName = "Querino Blog";
  const siteDescription = "Articles about AI, prompts, and productivity";

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select(
      `
      title,
      slug,
      excerpt,
      content,
      published_at,
      author:profiles!blog_posts_author_id_fkey(display_name)
    `,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    // The edge function failed loudly here rather than serving a truncated feed, and so
    // does this: a feed reader retries a 500, but silently accepts an empty channel as
    // "he stopped writing".
    throw new Error(`RSS query failed: ${error.message}`);
  }

  const items = (posts ?? [])
    .map((post) => {
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString();
      const link = `${SITE_ORIGIN}/blog/${post.slug}`;
      const author = post.author?.display_name || "Anonymous";
      const description = escapeXml(
        post.excerpt || post.content?.slice(0, 300) || "",
      );

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <description><![CDATA[${description}]]></description>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${SITE_ORIGIN}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

export async function buildSitemap(): Promise<string> {
  // Static pages with their priorities
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/discover", priority: "0.9", changefreq: "daily" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },

    // /auth intentionally excluded — login pages should not be advertised for indexing
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
    { loc: "/impressum", priority: "0.3", changefreq: "yearly" },
  ];

  // Fetch dynamic content in parallel
  const [blogPosts, prompts, skills, workflows, promptKits] = await Promise.all(
    [
      supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
      supabase
        .from("prompts")
        .select("slug, updated_at")
        .eq("is_public", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("skills")
        .select("slug, updated_at")
        .eq("published", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("workflows")
        .select("slug, updated_at")
        .eq("published", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("prompt_kits")
        .select("slug, updated_at")
        .eq("published", true)
        .order("updated_at", { ascending: false }),
    ],
  );

  const urls: string[] = [];

  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${SITE_ORIGIN}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Every artefact type is the same entry with a different prefix and priority, so the
  // five loops the edge function repeated are one loop over five sources here.
  const collections: Array<{
    prefix: string;
    priority: string;
    rows: Array<{ slug: string | null; updated_at: string | null }> | null;
  }> = [
    { prefix: "/blog", priority: "0.7", rows: blogPosts.data },
    { prefix: "/prompts", priority: "0.6", rows: prompts.data },
    { prefix: "/skills", priority: "0.6", rows: skills.data },
    { prefix: "/workflows", priority: "0.6", rows: workflows.data },
    { prefix: "/prompt-kits", priority: "0.6", rows: promptKits.data },
  ];

  for (const { prefix, priority, rows } of collections) {
    for (const row of rows ?? []) {
      if (!row.slug) continue;
      const lastmod = row.updated_at
        ? formatDate(row.updated_at)
        : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${SITE_ORIGIN}${prefix}/${escapeXml(row.slug)}</loc>
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
