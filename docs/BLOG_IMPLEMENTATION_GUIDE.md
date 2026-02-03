# Blog CMS Implementation Guide

A comprehensive guide for building a production-ready, WordPress-like blog system using **Lovable** and **Supabase**. This document provides copy-pasteable prompts to recreate the system in any project.

---

## Overview

This guide builds a full-featured blog CMS with:
- **Admin Dashboard**: WordPress-style sidebar navigation, post editor, media library
- **Public Pages**: SEO-optimized blog listing, post detail, category/tag filtering
- **REST API**: JSON endpoints + RSS feed for external integrations
- **Security**: Row-Level Security (RLS) with role-based access control

**Prerequisites**: Supabase must be connected to your Lovable project.

---

## Prompt 1 — Project Setup & Data Model

Start with this prompt to establish the architecture and create the database schema:

```
You are building a production-ready blog system for this SaaS product.

This blog will live at /blog and must:
- Use Supabase as the database and auth provider
- Act as a headless CMS with a WordPress-like admin experience
- Provide a clean REST API for posts, categories, tags, and media
- Support SEO, drafts, scheduled publishing, and revisions

This is NOT a static blog.
This is a CMS-style system with admin pages, public pages, and APIs.

Assume Supabase is already connected.

Design the Supabase database schema for a blog CMS.

Create tables:
- blog_posts
- blog_post_revisions
- blog_categories
- blog_tags
- blog_post_categories (junction table)
- blog_post_tags (junction table)
- blog_media

Requirements:
- posts support: title, slug, content (markdown), excerpt, status (draft/published/scheduled), published_at, author_id, featured_image_id, seo_title, seo_description, og_image_url
- revisions store historical content snapshots with revision_number
- categories support hierarchical structure with parent_id
- categories and tags are reusable and many-to-many
- media stores file metadata (url, alt_text, width, height, mime_type, file_size, uploaded_by)

Include:
- primary keys (UUID with gen_random_uuid())
- foreign keys to profiles table for author_id
- unique constraints on slug fields
- timestamps (created_at, updated_at)

Return SQL-ready migration definitions.
```

### Expected Schema

| Table | Purpose |
|-------|---------|
| `blog_posts` | Main content with status workflow |
| `blog_post_revisions` | Version history for content |
| `blog_categories` | Hierarchical categories |
| `blog_tags` | Flat tag taxonomy |
| `blog_post_categories` | Many-to-many junction |
| `blog_post_tags` | Many-to-many junction |
| `blog_media` | Image/file metadata |

---

## Prompt 2 — Row Level Security (RLS)

Secure the database:

```
Define Supabase Row Level Security (RLS) policies for the blog system.

Rules:
- Public users can read posts where status = 'published' AND published_at <= now()
- Authenticated admin users (is_admin function) can create, update, delete all blog entities
- Authors can view, create, update, and delete their own drafts
- Categories and tags are publicly readable, admin-writable
- Media is publicly readable, admin-uploadable
- Post revisions are viewable by admins and post authors

Provide SQL policies for each table.
Assume an is_admin(user_id) helper function already exists in the database.

Key RLS patterns to implement:

-- Public read for published content
CREATE POLICY "Anyone can view published posts"
ON blog_posts FOR SELECT
USING (status = 'published' AND published_at <= now());

-- Admin full access
CREATE POLICY "Admins can manage posts"
ON blog_posts FOR ALL
USING (is_admin(auth.uid()));

-- Author draft access
CREATE POLICY "Authors can manage their drafts"
ON blog_posts FOR ALL
USING (auth.uid() = author_id AND status = 'draft');
```

---

## Prompt 3 — Admin Dashboard Layout

Build the admin shell:

```
Build an admin dashboard layout for managing the blog CMS at /blog/admin.

Design goals:
- WordPress-like left sidebar navigation
- Clean, fast, minimal visual clutter
- Role-based access (redirect non-admins)

Admin sections (sidebar nav):
- Dashboard (overview stats)
- Posts (list with status filters)
- Categories (CRUD management)
- Tags (CRUD management)
- Media (library browser)

Requirements:
- Use the existing useUserRole hook to check for 'admin' role
- Show loading state while checking auth
- Redirect to /auth if not logged in
- Show "Access Denied" if logged in but not admin
- Include a "View Blog" link to open /blog in new tab

Create a reusable BlogAdminLayout component that wraps all admin pages.
```

---

## Prompt 4 — Post Editor

Implement the content editor:

```
Implement a post editor for the blog CMS at /blog/admin/posts/new and /blog/admin/posts/:id/edit.

Editor requirements:
- Markdown-first textarea editor
- Live preview toggle (side-by-side or tabbed)
- Fields: title, slug (auto-generated from title, manually editable), excerpt, content
- Category multi-select and tag multi-select
- SEO panel: SEO title, meta description, OG image URL
- Featured image selector (from media library)

Publish controls:
- Save as Draft button
- Publish Now button (sets status='published', published_at=now())
- Schedule button (sets status='scheduled', allows picking future published_at)

Additional features:
- Autosave drafts every 30 seconds
- Show "Saving..." / "Saved" indicator
- Slug uniqueness validation

The editor should feel fast and minimal, similar to WordPress or Ghost.
```

---

## Prompt 5 — Media Library

Create media management:

```
Create a media library integrated with Supabase Storage at /blog/admin/media.

Requirements:
- Create a storage bucket named "blog-media" with public read access
- Upload images via drag-and-drop or file picker
- Store metadata in blog_media table (url, alt_text, width, height, mime_type, file_size)
- Display grid of uploaded images with previews
- Click to view details: full preview, copy URL button, edit alt text
- Delete functionality (removes from storage and database)
- Search/filter by filename

Access control:
- Only admins can upload and delete
- Public read access for serving images

Show file size in human-readable format (KB, MB).

Storage bucket setup (include in migration):

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true);

-- RLS for storage
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-media');

CREATE POLICY "Admin upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-media' AND is_admin(auth.uid()));

CREATE POLICY "Admin delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-media' AND is_admin(auth.uid()));
```

---

## Prompt 6 — Public Blog Pages

Build the reader-facing pages:

```
Build the public-facing blog pages.

Pages to create:
- /blog (paginated post list, 10 per page)
- /blog/:slug (full post detail with markdown rendering)
- /blog/category/:slug (posts filtered by category)
- /blog/tag/:slug (posts filtered by tag)

Requirements:
- SEO-friendly: dynamic meta titles, descriptions, canonical URLs
- Open Graph + Twitter Card meta tags
- Featured image display
- Author avatar and name
- Published date formatting
- Category and tag badges/links
- Clean typography optimized for reading
- Responsive layout

Only show posts where status='published' AND published_at <= now().

Include a sidebar or section showing:
- Recent posts
- Categories list
- Tags cloud (optional)
```

---

## Prompt 7 — REST API

Expose data for external consumption:

```
Create a Supabase Edge Function to expose a clean REST API for the blog system.

Function name: blog-api

Endpoints:
- GET /blog-api/posts - List published posts (supports ?limit, ?offset, ?category, ?tag)
- GET /blog-api/posts/:slug - Get single post by slug (published only)
- GET /blog-api/categories - List all categories with post counts
- GET /blog-api/tags - List all tags with post counts

Requirements:
- JSON responses with consistent schema
- Include related data (author info, categories, tags) in post responses
- CORS headers for cross-origin access
- Cache-Control headers for performance
- Proper error responses (404 for not found, etc.)

Configure in supabase/config.toml with verify_jwt = false for public access.

Do NOT attempt WordPress API compatibility - use a clean, simple schema.

Expected response format:

{
  "posts": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-title",
      "excerpt": "Brief summary...",
      "published_at": "2024-01-15T10:00:00Z",
      "author": {
        "id": "uuid",
        "display_name": "Author Name",
        "avatar_url": "https://..."
      },
      "featured_image": {
        "url": "https://...",
        "alt_text": "Description"
      },
      "categories": [...],
      "tags": [...]
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0
  }
}
```

---

## Prompt 8 — SEO & RSS Feed

Add syndication support:

```
Add SEO and syndication support to the blog.

SEO Requirements:
- Dynamic meta titles (post title | Site Name)
- Dynamic meta descriptions (excerpt or custom SEO description)
- Canonical URLs for all pages
- Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- Twitter Card tags
- JSON-LD structured data for articles (optional)

RSS Feed:
- Create an Edge Function that serves RSS 2.0 XML at /api/rss.xml
- Include: title, link, description (excerpt), author, pubDate, guid
- Limit to 20 most recent published posts
- Set appropriate Content-Type and Cache-Control headers

RSS Autodiscovery:
- Add <link rel="alternate" type="application/rss+xml"> to blog page heads

Configure the RSS function in supabase/config.toml with verify_jwt = false.

Expected RSS feed structure:

<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Site Name Blog</title>
    <link>https://yoursite.com/blog</link>
    <description>Latest articles from Site Name</description>
    <language>en-us</language>
    <lastBuildDate>RFC 822 date</lastBuildDate>
    <item>
      <title>Post Title</title>
      <link>https://yoursite.com/blog/post-slug</link>
      <description>Post excerpt...</description>
      <author>author@email.com (Author Name)</author>
      <pubDate>RFC 822 date</pubDate>
      <guid isPermaLink="true">https://yoursite.com/blog/post-slug</guid>
    </item>
  </channel>
</rss>
```

---

## Prompt 9 — Final Review & Hardening

Validate the complete system:

```
Review the entire blog system for production readiness.

Security audit:
- Verify all RLS policies are correctly applied
- Confirm admin-only routes check user role
- Ensure no data leakage of draft/scheduled posts
- Validate storage bucket permissions

Performance review:
- Pagination is implemented correctly
- Queries are optimized (proper indexes exist)
- API responses include caching headers
- React Query is used for frontend data fetching

Architecture review:
- Clean separation between admin and public code
- Reusable hooks for data fetching (usePublicBlog, useBlogPosts)
- Consistent error handling
- TypeScript types for all entities

Provide a summary of:
- What was built
- Key files created
- Any remaining recommendations
```

---

## File Structure Reference

After completing all prompts, your project should include:

```
src/
├── components/
│   └── blog/
│       ├── admin/
│       │   └── BlogAdminLayout.tsx    # Admin shell with sidebar
│       ├── BlogPostCard.tsx           # Post preview card
│       ├── BlogPagination.tsx         # Pagination controls
│       └── BlogSidebar.tsx            # Categories/tags sidebar
├── hooks/
│   ├── useBlogPosts.ts                # Admin CRUD operations
│   ├── useBlogCategories.ts           # Category management
│   ├── useBlogTags.ts                 # Tag management
│   ├── useBlogMedia.ts                # Media library operations
│   └── usePublicBlog.ts               # Public read-only queries
├── pages/
│   └── blog/
│       ├── BlogList.tsx               # /blog
│       ├── BlogPost.tsx               # /blog/:slug
│       ├── BlogCategory.tsx           # /blog/category/:slug
│       ├── BlogTag.tsx                # /blog/tag/:slug
│       └── admin/
│           ├── BlogAdminDashboard.tsx # /blog/admin
│           ├── BlogAdminPosts.tsx     # /blog/admin/posts
│           ├── BlogAdminPostEditor.tsx # /blog/admin/posts/:id
│           ├── BlogAdminCategories.tsx # /blog/admin/categories
│           ├── BlogAdminTags.tsx      # /blog/admin/tags
│           └── BlogAdminMedia.tsx     # /blog/admin/media
└── types/
    └── blog.ts                        # TypeScript interfaces

supabase/
└── functions/
    ├── blog-api/
    │   └── index.ts                   # REST API endpoints
    └── api/
        └── index.ts                   # RSS feed endpoint
```

---

## Database Tables Summary

| Table | Columns |
|-------|---------|
| `blog_posts` | id, title, slug, content, excerpt, status, published_at, author_id, featured_image_id, seo_title, seo_description, og_image_url, created_at, updated_at |
| `blog_post_revisions` | id, post_id, title, content, excerpt, revision_number, created_at, created_by |
| `blog_categories` | id, name, slug, description, parent_id, created_at, updated_at |
| `blog_tags` | id, name, slug, created_at |
| `blog_post_categories` | id, post_id, category_id, created_at |
| `blog_post_tags` | id, post_id, tag_id, created_at |
| `blog_media` | id, url, alt_text, width, height, mime_type, file_size, uploaded_by, created_at |

---

## Tips for Success

1. **Run prompts sequentially** — Each prompt builds on the previous
2. **Verify RLS after schema creation** — Test with different user roles
3. **Test the public/admin separation** — Ensure non-admins can't access admin routes
4. **Check SEO output** — Use browser dev tools to verify meta tags
5. **Validate RSS feed** — Use an RSS validator tool

---

## Result

A WordPress-level CMS experience that is:
- **Fully owned** — No external dependencies
- **Production-ready** — Secure, performant, SEO-optimized
- **Maintainable** — Clean architecture with clear separation of concerns
- **Extensible** — Easy to add features like comments, newsletters, etc.
