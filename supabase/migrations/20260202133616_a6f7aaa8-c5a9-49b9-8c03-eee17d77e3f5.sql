-- Blog CMS Schema for Querino

-- Categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags table
CREATE TABLE public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Media table
CREATE TABLE public.blog_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posts table (main content)
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  featured_image_id UUID REFERENCES public.blog_media(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post revisions for version history
CREATE TABLE public.blog_post_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  revision_number INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table: posts <-> categories (many-to-many)
CREATE TABLE public.blog_post_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, category_id)
);

-- Junction table: posts <-> tags (many-to-many)
CREATE TABLE public.blog_post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_post_revisions_post ON public.blog_post_revisions(post_id);
CREATE INDEX idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX idx_blog_tags_slug ON public.blog_tags(slug);

-- Updated_at triggers
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate slug for posts
CREATE OR REPLACE FUNCTION public.set_blog_post_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title AND NEW.slug = OLD.slug) THEN
    base_slug := public.generate_slug(NEW.title);
    new_slug := base_slug;
    
    LOOP
      IF NOT EXISTS(SELECT 1 FROM public.blog_posts WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_blog_post_slug_trigger
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_post_slug();

-- Auto-generate slug for categories
CREATE OR REPLACE FUNCTION public.set_blog_category_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_slug(NEW.name);
    new_slug := base_slug;
    
    LOOP
      IF NOT EXISTS(SELECT 1 FROM public.blog_categories WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_blog_category_slug_trigger
  BEFORE INSERT OR UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_category_slug();

-- Auto-generate slug for tags
CREATE OR REPLACE FUNCTION public.set_blog_tag_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_slug(NEW.name);
    new_slug := base_slug;
    
    LOOP
      IF NOT EXISTS(SELECT 1 FROM public.blog_tags WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_blog_tag_slug_trigger
  BEFORE INSERT OR UPDATE ON public.blog_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_tag_slug();

-- Auto-increment revision number
CREATE OR REPLACE FUNCTION public.set_blog_revision_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.revision_number := COALESCE(
    (SELECT MAX(revision_number) FROM public.blog_post_revisions WHERE post_id = NEW.post_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_blog_revision_number_trigger
  BEFORE INSERT ON public.blog_post_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_revision_number();

-- Enable RLS on all tables
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Anyone can view categories"
  ON public.blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.blog_categories FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for blog_tags
CREATE POLICY "Anyone can view tags"
  ON public.blog_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON public.blog_tags FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for blog_media
CREATE POLICY "Anyone can view media"
  ON public.blog_media FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage media"
  ON public.blog_media FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for blog_posts
CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at <= now());

CREATE POLICY "Admins can view all posts"
  ON public.blog_posts FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update posts"
  ON public.blog_posts FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete posts"
  ON public.blog_posts FOR DELETE
  USING (is_admin(auth.uid()));

-- RLS Policies for blog_post_revisions
CREATE POLICY "Admins can view revisions"
  ON public.blog_post_revisions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create revisions"
  ON public.blog_post_revisions FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for blog_post_categories
CREATE POLICY "Anyone can view post categories"
  ON public.blog_post_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage post categories"
  ON public.blog_post_categories FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for blog_post_tags
CREATE POLICY "Anyone can view post tags"
  ON public.blog_post_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage post tags"
  ON public.blog_post_tags FOR ALL
  USING (is_admin(auth.uid()));