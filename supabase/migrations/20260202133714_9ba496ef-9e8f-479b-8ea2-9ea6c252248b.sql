-- Add policy for authors to view their own posts (including drafts)
CREATE POLICY "Authors can view their own posts"
ON public.blog_posts
FOR SELECT
USING (auth.uid() = author_id);

-- Add policy for authors to update their own draft posts
CREATE POLICY "Authors can update their own drafts"
ON public.blog_posts
FOR UPDATE
USING (auth.uid() = author_id AND status = 'draft')
WITH CHECK (auth.uid() = author_id AND status = 'draft');

-- Add policy for authors to create posts (as drafts)
CREATE POLICY "Authors can create posts"
ON public.blog_posts
FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Add policy for authors to delete their own drafts
CREATE POLICY "Authors can delete their own drafts"
ON public.blog_posts
FOR DELETE
USING (auth.uid() = author_id AND status = 'draft');

-- Add policy for authors to view revisions of their own posts
CREATE POLICY "Authors can view their own post revisions"
ON public.blog_post_revisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE blog_posts.id = blog_post_revisions.post_id
    AND blog_posts.author_id = auth.uid()
  )
);

-- Add policy for authors to create revisions for their own posts
CREATE POLICY "Authors can create revisions for own posts"
ON public.blog_post_revisions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE blog_posts.id = blog_post_revisions.post_id
    AND blog_posts.author_id = auth.uid()
  )
);

-- Add policy for authors to manage categories on their own posts
CREATE POLICY "Authors can manage their post categories"
ON public.blog_post_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE blog_posts.id = blog_post_categories.post_id
    AND blog_posts.author_id = auth.uid()
  )
);

-- Add policy for authors to manage tags on their own posts
CREATE POLICY "Authors can manage their post tags"
ON public.blog_post_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE blog_posts.id = blog_post_tags.post_id
    AND blog_posts.author_id = auth.uid()
  )
);

-- Add policy for authors to upload media
CREATE POLICY "Authors can upload media"
ON public.blog_media
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);