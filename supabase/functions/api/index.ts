import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/api", "");

  console.log(`[api] ${req.method} ${path}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // GET /rss.xml
    if (path === "/rss.xml") {
      return await handleGetRSS(supabase);
    }

    // GET /sitemap.xml
    if (path === "/sitemap.xml") {
      return await handleGetSitemap(supabase);
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: "Not found", path }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[api] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleGetRSS(supabase: any) {
  const siteUrl = "https://querino.ai";
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
    console.error("[api] RSS query error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate RSS" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const items = (posts || [])
    .map((post: any) => {
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString();
      const link = `${siteUrl}/blog/${post.slug}`;
      const author = post.author?.display_name || "Anonymous";
      // CDATA already carries the text verbatim, so escaping it first
      // double-encoded every "&" for the reader.
      const description = cdata(
        post.excerpt || post.content?.slice(0, 300) || "",
      );

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <description>${description}</description>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function handleGetSitemap(supabase: any) {
  const siteUrl = "https://querino.ai";

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

  // Fetch dynamic content in parallel. Each section is paged, because
  // PostgREST silently stops at 1000 rows and a sitemap that quietly drops
  // the oldest prompts is worse than a slow one. A query error is a 500 for
  // the whole sitemap: a section served as empty behind a one-hour cache
  // would tell crawlers those pages are gone.
  let blogPosts: SlugRow[];
  let prompts: SlugRow[];
  let skills: SlugRow[];
  let workflows: SlugRow[];
  let promptKits: SlugRow[];
  try {
    [blogPosts, prompts, skills, workflows, promptKits] = await Promise.all([
      fetchAllSlugs(supabase, "blog_posts", "status", "published"),
      fetchAllSlugs(supabase, "prompts", "is_public", true),
      fetchAllSlugs(supabase, "skills", "published", true),
      fetchAllSlugs(supabase, "workflows", "published", true),
      fetchAllSlugs(supabase, "prompt_kits", "published", true),
    ]);
  } catch (err) {
    console.error("[api] Sitemap query error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate sitemap" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Build URL entries
  const urls: string[] = [];

  // Add static pages
  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Add blog posts
  for (const post of blogPosts) {
    if (post.slug) {
      const lastmod = post.updated_at
        ? formatDate(post.updated_at)
        : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  // Add public prompts
  for (const prompt of prompts) {
    if (prompt.slug) {
      const lastmod = prompt.updated_at
        ? formatDate(prompt.updated_at)
        : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/prompts/${escapeXml(prompt.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  // Add public skills
  for (const skill of skills) {
    if (skill.slug) {
      const lastmod = skill.updated_at
        ? formatDate(skill.updated_at)
        : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/skills/${escapeXml(skill.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  // Add public workflows
  for (const workflow of workflows) {
    if (workflow.slug) {
      const lastmod = workflow.updated_at
        ? formatDate(workflow.updated_at)
        : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/workflows/${escapeXml(workflow.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  // Add public prompt kits
  for (const kit of promptKits) {
    if (kit.slug) {
      const lastmod = kit.updated_at
        ? formatDate(kit.updated_at)
        : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/prompt-kits/${escapeXml(kit.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;

  console.log(`[api] Sitemap generated with ${urls.length} URLs`);

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

interface SlugRow {
  slug: string | null;
  updated_at: string | null;
}

const SITEMAP_PAGE = 1000;

/**
 * Every published slug of one table, in pages of 1000, newest first. Throws
 * on a query error so the caller can refuse the whole sitemap instead of
 * serving a hole.
 */
async function fetchAllSlugs(
  supabase: any,
  table: string,
  flagColumn: string,
  flagValue: string | boolean,
): Promise<SlugRow[]> {
  const all: SlugRow[] = [];
  for (let from = 0; ; from += SITEMAP_PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("slug, updated_at")
      .eq(flagColumn, flagValue)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + SITEMAP_PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page: SlugRow[] = data || [];
    all.push(...page);
    if (page.length < SITEMAP_PAGE) break;
  }
  return all;
}

function formatDate(isoDate: string): string {
  // Return YYYY-MM-DD format for sitemap
  return isoDate.split("T")[0];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wrap text in a CDATA section. The only sequence CDATA cannot hold is its
 * own terminator, so a literal "]]>" is split across two sections.
 */
function cdata(str: string): string {
  return `<![CDATA[${str.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}
