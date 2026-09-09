import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SITE_ORIGIN } from "../_shared/artifactRoutes.ts";

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
      return await handleGetRSS(supabase);
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: "Not found", path }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("[blog-api] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function handleGetPosts(supabase: any, params: URLSearchParams) {
  // Public endpoint: never honour a client-supplied status — drafts stay private.
  const status = "published";
  // limit and offset go straight into a range header, so anything that is
  // not a whole number in range is refused up front: "abc" gave NaN, 0 and a
  // negative offset made PostgREST answer with an error that surfaced as 500.
  const limit = parsePagingNumber(params.get("limit"), 20);
  const offset = parsePagingNumber(params.get("offset"), 0);
  if (limit === null || limit < 1 || limit > 100) {
    return new Response(
      JSON.stringify({ error: "limit must be a whole number from 1 to 100" }),
      { status: 400, headers: corsHeaders },
    );
  }
  if (offset === null || offset < 0) {
    return new Response(
      JSON.stringify({ error: "offset must be a whole number of 0 or more" }),
      { status: 400, headers: corsHeaders },
    );
  }
  const categorySlug = params.get("category");
  const tagSlug = params.get("tag");

  const emptyPage = () =>
    new Response(
      JSON.stringify({ data: [], meta: { total: 0, limit, offset } }),
      { headers: { ...corsHeaders, "Cache-Control": "public, max-age=300" } },
    );
  const lookupFailed = (what: string, err: unknown) => {
    console.error(`[blog-api] ${what} lookup error:`, err);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
      headers: corsHeaders,
    });
  };

  let query = supabase
    .from("blog_posts")
    .select(
      `
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
    `,
      { count: "exact" },
    )
    .eq("status", status)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by category. A slug nobody has is an empty page, not the whole
  // unfiltered list, which is what an ignored filter used to hand back.
  if (categorySlug) {
    const { data: category, error: catErr } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (catErr) return lookupFailed("category", catErr);
    if (!category) return emptyPage();

    const { data: postIds, error: linkErr } = await supabase
      .from("blog_post_categories")
      .select("post_id")
      .eq("category_id", category.id);
    if (linkErr) return lookupFailed("category posts", linkErr);

    const ids = postIds?.map((p: any) => p.post_id) || [];
    if (ids.length === 0) return emptyPage();
    query = query.in("id", ids);
  }

  // Filter by tag, same rules as the category filter.
  if (tagSlug) {
    const { data: tag, error: tagErr } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug", tagSlug)
      .maybeSingle();
    if (tagErr) return lookupFailed("tag", tagErr);
    if (!tag) return emptyPage();

    const { data: postIds, error: linkErr } = await supabase
      .from("blog_post_tags")
      .select("post_id")
      .eq("tag_id", tag.id);
    if (linkErr) return lookupFailed("tag posts", linkErr);

    const ids = postIds?.map((p: any) => p.post_id) || [];
    if (ids.length === 0) return emptyPage();
    query = query.in("id", ids);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[blog-api] Posts query error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Categories and tags for the whole page in two queries, grouped in memory,
  // instead of two queries per post.
  const posts: any[] = data || [];
  const ids = posts.map((p) => p.id);
  const categoriesByPost = new Map<string, any[]>();
  const tagsByPost = new Map<string, any[]>();

  if (ids.length > 0) {
    const [catLinks, tagLinks] = await Promise.all([
      supabase
        .from("blog_post_categories")
        .select("post_id, category:blog_categories(id, name, slug)")
        .in("post_id", ids),
      supabase
        .from("blog_post_tags")
        .select("post_id, tag:blog_tags(id, name, slug)")
        .in("post_id", ids),
    ]);
    if (catLinks.error) return lookupFailed("post categories", catLinks.error);
    if (tagLinks.error) return lookupFailed("post tags", tagLinks.error);

    for (const row of catLinks.data || []) {
      if (!row.category) continue;
      const list = categoriesByPost.get(row.post_id) ?? [];
      list.push(row.category);
      categoriesByPost.set(row.post_id, list);
    }
    for (const row of tagLinks.data || []) {
      if (!row.tag) continue;
      const list = tagsByPost.get(row.post_id) ?? [];
      list.push(row.tag);
      tagsByPost.set(row.post_id, list);
    }
  }

  const enrichedPosts = posts.map((post) => ({
    ...post,
    categories: categoriesByPost.get(post.id) ?? [],
    tags: tagsByPost.get(post.id) ?? [],
  }));

  return new Response(
    JSON.stringify({
      data: enrichedPosts,
      meta: {
        total: count || 0,
        limit,
        offset,
      },
    }),
    // Public, read-only, and only published posts: five minutes at the edge
    // keeps a busy list page from hitting the database on every request.
    { headers: { ...corsHeaders, "Cache-Control": "public, max-age=300" } },
  );
}

/**
 * A paging parameter as a whole number, the default when it is absent, and
 * null when it is present but not a whole number.
 */
function parsePagingNumber(
  raw: string | null,
  fallback: number,
): number | null {
  if (raw === null || raw === "") return fallback;
  if (!/^-?\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

async function handleGetPost(supabase: any, slug: string) {
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(
      `
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
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[blog-api] Post query error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch post" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!post) {
    return new Response(JSON.stringify({ error: "Post not found" }), {
      status: 404,
      headers: corsHeaders,
    });
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
    { headers: corsHeaders },
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
      { status: 500, headers: corsHeaders },
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
    }),
  );

  return new Response(JSON.stringify({ data: categoriesWithCounts }), {
    headers: corsHeaders,
  });
}

async function handleGetTags(supabase: any) {
  const { data, error } = await supabase
    .from("blog_tags")
    .select("id, name, slug, created_at")
    .order("name");

  if (error) {
    console.error("[blog-api] Tags query error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch tags" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Get post counts for each tag
  const tagsWithCounts = await Promise.all(
    (data || []).map(async (tag: any) => {
      const { count } = await supabase
        .from("blog_post_tags")
        .select("*", { count: "exact", head: true })
        .eq("tag_id", tag.id);

      return { ...tag, post_count: count || 0 };
    }),
  );

  return new Response(JSON.stringify({ data: tagsWithCounts }), {
    headers: corsHeaders,
  });
}

async function handleGetRSS(supabase: any) {
  // The links in the feed point at the site. The self link has to be the URL
  // this feed is actually fetched from, and that is this function on the
  // project's functions origin, not /api/rss.xml on the site, which is a 404.
  const siteUrl = SITE_ORIGIN;
  const selfUrl = `${SUPABASE_URL}/functions/v1/blog-api/rss.xml`;
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
    console.error("[blog-api] RSS query error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate RSS" }), {
      status: 500,
      headers: corsHeaders,
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
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>
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

/**
 * Wrap text in a CDATA section. The only sequence CDATA cannot hold is its
 * own terminator, so a literal "]]>" is split across two sections.
 */
function cdata(str: string): string {
  return `<![CDATA[${str.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}
