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
    return new Response(
      JSON.stringify({ error: "Not found", path }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[api] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleGetRSS(supabase: any) {
  const siteUrl = "https://querino.ai";
  const siteName = "Querino Blog";
  const siteDescription = "Articles about AI, prompts, and productivity";

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select(`
      title,
      slug,
      excerpt,
      content,
      published_at,
      author:profiles!blog_posts_author_id_fkey(display_name)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[api] RSS query error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate RSS" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const items = (posts || [])
    .map((post: any) => {
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString();
      const link = `${siteUrl}/blog/${post.slug}`;
      const author = post.author?.display_name || "Anonymous";
      const description = escapeXml(post.excerpt || post.content?.slice(0, 300) || "");

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
    { loc: "/pricing", priority: "0.7", changefreq: "weekly" },
    { loc: "/auth", priority: "0.5", changefreq: "monthly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
    { loc: "/impressum", priority: "0.3", changefreq: "yearly" },
  ];

  // Fetch dynamic content in parallel
  const [blogPosts, prompts, skills, workflows, claws] = await Promise.all([
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
      .from("claws")
      .select("slug, updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false }),
  ]);

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
  for (const post of blogPosts.data || []) {
    if (post.slug) {
      const lastmod = post.updated_at ? formatDate(post.updated_at) : formatDate(new Date().toISOString());
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
  for (const prompt of prompts.data || []) {
    if (prompt.slug) {
      const lastmod = prompt.updated_at ? formatDate(prompt.updated_at) : formatDate(new Date().toISOString());
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
  for (const skill of skills.data || []) {
    if (skill.slug) {
      const lastmod = skill.updated_at ? formatDate(skill.updated_at) : formatDate(new Date().toISOString());
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
  for (const workflow of workflows.data || []) {
    if (workflow.slug) {
      const lastmod = workflow.updated_at ? formatDate(workflow.updated_at) : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/workflows/${escapeXml(workflow.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  // Add public claws
  for (const claw of claws.data || []) {
    if (claw.slug) {
      const lastmod = claw.updated_at ? formatDate(claw.updated_at) : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/claws/${escapeXml(claw.slug)}</loc>
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
