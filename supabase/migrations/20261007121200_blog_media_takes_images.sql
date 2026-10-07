-- The blog-media bucket takes images of a sensible size (2026-10-07 review).
--
-- What was wrong. blog-media is a public bucket with no size limit and no
-- type list, unlike avatars. Only admins may upload, but a mistaken or
-- compromised admin session could put any file of any size at a public URL
-- under the project's domain, an HTML or SVG file included. The upload code
-- (src/hooks/useBlogMedia.ts) only ever sends images. The bucket is empty.
--
-- What it changes. 10 MB per file, and JPEG, PNG, GIF, WebP and AVIF only.
-- SVG is left out on purpose: it can carry script.

UPDATE storage.buckets
   SET file_size_limit = 10485760,
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
 WHERE id = 'blog-media';
