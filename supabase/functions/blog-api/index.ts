import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Remove /blog-api prefix and any query string from path matching
  const fullPath = url.pathname.replace("/blog-api", "");
  const path = fullPath.split("?")[0];
  
  console.log(`[blog-api] ${req.method} ${path}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // GET /posts or /posts?status=published
    if (path === "/posts" || path === "/posts/") {
      return await handleGetPosts(supabase, url.searchParams);
    }

    // GET /posts/{slug}
    const postMatch = path.match(/^\/posts\/([^/]+)$/);
    if (postMatch) {
      return await handleGetPost(supabase, postMatch[1]);
    }

    // GET /categories
    if (path === "/categories" || path === "/categories/") {
      return await handleGetCategories(supabase);
    }

    // GET /tags
    if (path === "/tags" || path === "/tags/") {
      return await handleGetTags(supabase);
    }

    // GET /rss.xml
    if (path === "/rss.xml") {
      return await handleGetRSS(supabase, url.origin);
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: "Not found", path }),
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    console.error("[blog-api] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function handleGetPosts(supabase: any, params: URLSearchParams) {
  const status = params.get("status") || "published";
  const limit = Math.min(parseInt(params.get("limit") || "20", 10), 100);
  const offset = parseInt(params.get("offset") || "0", 10);
  const categorySlug = params.get("category");
  const tagSlug = params.get("tag");

  let query = supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      status,
      published_at,
      created_at,
      updated_at,
      seo_title,
      seo_description,
      og_image_url,
      author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
      featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text, width, height)
    `, { count: "exact" })
    .eq("status", status)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by category
  if (categorySlug) {
    const { data: category } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (category) {
      const { data: postIds } = await supabase
        .from("blog_post_categories")
        .select("post_id")
        .eq("category_id", category.id);

      const ids = postIds?.map((p: any) => p.post_id) || [];
      if (ids.length > 0) {
        query = query.in("id", ids);
      } else {
        return new Response(
          JSON.stringify({ data: [], meta: { total: 0, limit, offset } }),
          { headers: corsHeaders }
        );
      }
    }
  }

  // Filter by tag
  if (tagSlug) {
    const { data: tag } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug", tagSlug)
      .maybeSingle();

    if (tag) {
      const { data: postIds } = await supabase
        .from("blog_post_tags")
        .select("post_id")
        .eq("tag_id", tag.id);

      const ids = postIds?.map((p: any) => p.post_id) || [];
      if (ids.length > 0) {
        query = query.in("id", ids);
      } else {
        return new Response(
          JSON.stringify({ data: [], meta: { total: 0, limit, offset } }),
          { headers: corsHeaders }
        );
      }
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[blog-api] Posts query error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch posts" }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Fetch categories and tags for each post
  const enrichedPosts = await Promise.all(
    (data || []).map(async (post: any) => {
      const [categories, tags] = await Promise.all([
        supabase
          .from("blog_post_categories")
          .select("category:blog_categories(id, name, slug)")
          .eq("post_id", post.id),
        supabase
          .from("blog_post_tags")
          .select("tag:blog_tags(id, name, slug)")
          .eq("post_id", post.id),
      ]);

      return {
        ...post,
        categories: categories.data?.map((c: any) => c.category) || [],
        tags: tags.data?.map((t: any) => t.tag) || [],
      };
    })
  );

  return new Response(
    JSON.stringify({
      data: enrichedPosts,
      meta: {
        total: count || 0,
        limit,
        offset,
      },
    }),
    { headers: corsHeaders }
  );
}

async function handleGetPost(supabase: any, slug: string) {
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      status,
      published_at,
      created_at,
      updated_at,
      seo_title,
      seo_description,
      og_image_url,
      author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
      featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text, width, height)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[blog-api] Post query error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch post" }),
      { status: 500, headers: corsHeaders }
    );
  }

  if (!post) {
    return new Response(
      JSON.stringify({ error: "Post not found" }),
      { status: 404, headers: corsHeaders }
    );
  }

  // Fetch categories and tags
  const [categories, tags] = await Promise.all([
    supabase
      .from("blog_post_categories")
      .select("category:blog_categories(id, name, slug)")
      .eq("post_id", post.id),
    supabase
      .from("blog_post_tags")
      .select("tag:blog_tags(id, name, slug)")
      .eq("post_id", post.id),
  ]);

  return new Response(
    JSON.stringify({
      data: {
        ...post,
        categories: categories.data?.map((c: any) => c.category) || [],
        tags: tags.data?.map((t: any) => t.tag) || [],
      },
    }),
    { headers: corsHeaders }
  );
}

async function handleGetCategories(supabase: any) {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description, parent_id, created_at")
    .order("name");

  if (error) {
    console.error("[blog-api] Categories query error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch categories" }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Get post counts for each category
  const categoriesWithCounts = await Promise.all(
    (data || []).map(async (category: any) => {
      const { count } = await supabase
        .from("blog_post_categories")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id);

      return { ...category, post_count: count || 0 };
    })
  );

  return new Response(
    JSON.stringify({ data: categoriesWithCounts }),
    { headers: corsHeaders }
  );
}

async function handleGetTags(supabase: any) {
  const { data, error } = await supabase
    .from("blog_tags")
    .select("id, name, slug, created_at")
    .order("name");

  if (error) {
    console.error("[blog-api] Tags query error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch tags" }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Get post counts for each tag
  const tagsWithCounts = await Promise.all(
    (data || []).map(async (tag: any) => {
      const { count } = await supabase
        .from("blog_post_tags")
        .select("*", { count: "exact", head: true })
        .eq("tag_id", tag.id);

      return { ...tag, post_count: count || 0 };
    })
  );

  return new Response(
    JSON.stringify({ data: tagsWithCounts }),
    { headers: corsHeaders }
  );
}

async function handleGetRSS(supabase: any, origin: string) {
  const siteUrl = "https://querino.lovable.app";
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
    console.error("[blog-api] RSS query error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate RSS" }),
      { status: 500, headers: corsHeaders }
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
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
