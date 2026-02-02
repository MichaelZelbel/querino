# Dynamic Sitemap Implementation Guide

This guide explains how to implement a dynamic XML sitemap using Supabase Edge Functions and how to proxy it through Cloudflare to serve it on your custom domain.

---

## Part 1: Supabase Edge Function Implementation

### Prompt for AI Assistant

Use this prompt to implement the dynamic sitemap in another project:

---

**PROMPT START**

Create a dynamic sitemap.xml endpoint using a Supabase Edge Function. The sitemap should:

1. **Create an edge function** at `supabase/functions/api/index.ts` that handles GET requests to `/sitemap.xml`

2. **Include static pages** with appropriate priorities:
   - Homepage `/` - priority 1.0, changefreq daily
   - Main feature pages - priority 0.7-0.9, changefreq daily/weekly
   - Legal pages (terms, privacy) - priority 0.3, changefreq yearly

3. **Include dynamic content** by querying the database for:
   - Published blog posts (from `blog_posts` table where `status = 'published'`)
   - Any other public content tables (prompts, products, etc.)

4. **For each dynamic URL include:**
   - `<loc>` - full URL with the production domain
   - `<lastmod>` - from `updated_at` field in YYYY-MM-DD format
   - `<changefreq>` - typically "weekly" for content
   - `<priority>` - typically 0.6-0.7 for content pages

5. **Response headers:**
   - `Content-Type: application/xml; charset=utf-8`
   - `Cache-Control: public, max-age=3600` (1 hour cache)
   - CORS headers for cross-origin access

6. **XML format:** Standard sitemap protocol from sitemaps.org

Here's the reference implementation:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/api", "");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    if (path === "/sitemap.xml") {
      return await handleGetSitemap(supabase);
    }

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

async function handleGetSitemap(supabase: any) {
  const siteUrl = "https://yourdomain.com"; // CHANGE THIS
  
  // Static pages with their priorities
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/about", priority: "0.8", changefreq: "weekly" },
    { loc: "/pricing", priority: "0.7", changefreq: "weekly" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  ];

  // Fetch dynamic content in parallel
  const [blogPosts, products] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_public", true)
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

  // Add products (example - adjust for your content types)
  for (const product of products.data || []) {
    if (product.slug) {
      const lastmod = product.updated_at ? formatDate(product.updated_at) : formatDate(new Date().toISOString());
      urls.push(`
  <url>
    <loc>${siteUrl}/products/${escapeXml(product.slug)}</loc>
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
```

**PROMPT END**

---

## Part 2: Cloudflare Setup Instructions

### Prerequisites

- Domain registered with any registrar (Namecheap, GoDaddy, etc.)
- Cloudflare account (free tier works)
- Supabase project with the edge function deployed

### Step 1: Add Domain to Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Add a Site"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Select the **Free plan** (sufficient for this use case)
5. Cloudflare will scan your existing DNS records

### Step 2: Update Nameservers at Your Registrar

1. Cloudflare will provide two nameservers, e.g.:
   - `ada.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`

2. Go to your domain registrar (e.g., Namecheap):
   - Navigate to **Domain List** → your domain → **Manage**
   - Under **Nameservers**, select **Custom DNS**
   - Enter the Cloudflare nameservers
   - Save changes

3. Wait for propagation (can take up to 48 hours, usually faster)

### Step 3: Configure DNS Records in Cloudflare

Once your domain is active in Cloudflare, set up DNS records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | 185.158.133.1 | Proxied (orange cloud) |
| A | www | 185.158.133.1 | Proxied (orange cloud) |

> **Note:** The IP `185.158.133.1` is for Lovable-hosted projects. Adjust if using a different host.

### Step 4: Create a Cloudflare Worker

1. In Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Create Worker**

2. Name it something like `sitemap-proxy`

3. Replace the default code with:

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only intercept /sitemap.xml requests
    if (url.pathname === '/sitemap.xml') {
      // Your Supabase Edge Function URL
      const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/api/sitemap.xml';
      
      try {
        const response = await fetch(supabaseUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml',
          },
        });
        
        if (!response.ok) {
          return new Response('Sitemap temporarily unavailable', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        const sitemap = await response.text();
        
        return new Response(sitemap, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'X-Robots-Tag': 'noindex', // Prevent indexing the sitemap itself
          },
        });
      } catch (error) {
        console.error('Sitemap fetch error:', error);
        return new Response('Error fetching sitemap', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }
    
    // For all other requests, pass through to origin
    return fetch(request);
  },
};
```

4. **Replace** `YOUR_PROJECT_ID` with your actual Supabase project ID

5. Click **Save and Deploy**

### Step 5: Add Worker Route

1. Go to **Workers Routes** (in the Workers section or under your domain's settings)

2. Click **Add Route**

3. Configure:
   - **Route:** `yourdomain.com/sitemap.xml`
   - **Worker:** Select `sitemap-proxy`
   - **Environment:** Production

4. Optionally add for www subdomain:
   - **Route:** `www.yourdomain.com/sitemap.xml`
   - **Worker:** Select `sitemap-proxy`

5. Click **Save**

### Step 6: Update robots.txt

Update your `public/robots.txt` to reference the canonical sitemap URL:

```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

### Step 7: Verify Setup

1. Visit `https://yourdomain.com/sitemap.xml` in a browser
2. You should see the XML sitemap with your domain's URLs
3. Use [Google Search Console](https://search.google.com/search-console) to submit and validate the sitemap

---

## Troubleshooting

### Sitemap returns 404
- Check that the Worker route is correctly configured
- Verify the Supabase Edge Function is deployed and accessible

### Sitemap shows wrong domain
- Update the `siteUrl` variable in the Edge Function
- Redeploy the Edge Function

### Cloudflare Worker errors
- Check Worker logs in Cloudflare Dashboard → Workers → your worker → Logs
- Verify the Supabase URL is correct

### DNS not propagating
- Use [DNS Checker](https://dnschecker.org/) to verify propagation
- Ensure nameservers at registrar match Cloudflare's provided nameservers

### CORS errors
- The Edge Function includes CORS headers; ensure they're not being stripped
- Check Cloudflare's security settings aren't blocking the request

---

## Optional Enhancements

### RSS Feed
Add an RSS feed endpoint in the same Edge Function:

```typescript
if (path === "/rss.xml") {
  return await handleGetRSS(supabase);
}
```

### Sitemap Index
For sites with 50,000+ URLs, split into multiple sitemaps and create a sitemap index.

### Cache Purging
Set up a Cloudflare API call to purge the sitemap cache when content is updated.

---

## Quick Reference

| Item | Value |
|------|-------|
| Edge Function Path | `supabase/functions/api/index.ts` |
| Sitemap Endpoint | `/api/sitemap.xml` |
| Cache Duration | 1 hour (3600 seconds) |
| Cloudflare Worker Route | `yourdomain.com/sitemap.xml` |
