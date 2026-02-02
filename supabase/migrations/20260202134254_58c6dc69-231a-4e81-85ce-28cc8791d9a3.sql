-- Create the blog-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to blog-media bucket
CREATE POLICY "Public can view blog media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-media');

-- Only admins can upload to blog-media bucket
CREATE POLICY "Admins can upload blog media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-media' 
  AND is_admin(auth.uid())
);

-- Only admins can update blog media
CREATE POLICY "Admins can update blog media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'blog-media' AND is_admin(auth.uid()))
WITH CHECK (bucket_id = 'blog-media' AND is_admin(auth.uid()));

-- Only admins can delete blog media
CREATE POLICY "Admins can delete blog media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'blog-media' AND is_admin(auth.uid()));