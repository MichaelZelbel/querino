-- Create claws table (mirrors workflows structure)
CREATE TABLE public.claws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  source TEXT DEFAULT 'clawbot'::TEXT,
  published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.profiles(id),
  team_id UUID REFERENCES public.teams(id),
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index on slug
CREATE UNIQUE INDEX claws_slug_unique ON public.claws(slug) WHERE slug IS NOT NULL;

-- Enable RLS
ALTER TABLE public.claws ENABLE ROW LEVEL SECURITY;

-- RLS Policies (mirroring workflows)
CREATE POLICY "Published claws are viewable by everyone"
ON public.claws FOR SELECT
USING (published = true);

CREATE POLICY "Users can view their own claws"
ON public.claws FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own claws"
ON public.claws FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own claws"
ON public.claws FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own claws"
ON public.claws FOR DELETE
USING (auth.uid() = author_id);

-- Team policies
CREATE POLICY "Premium team members can view team claws"
ON public.claws FOR SELECT
USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  AND is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can create team claws"
ON public.claws FOR INSERT
WITH CHECK (
  team_id IS NULL OR (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    AND is_premium_user(auth.uid())
  )
);

CREATE POLICY "Premium team members can update team claws"
ON public.claws FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  AND is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can delete team claws"
ON public.claws FOR DELETE
USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  AND is_premium_user(auth.uid())
);

-- Update generate_unique_slug to support claws
CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_title text, p_table text, p_exclude_id uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  base_slug := public.generate_slug(p_title);
  new_slug := base_slug;
  
  LOOP
    IF p_table = 'prompts' THEN
      SELECT EXISTS(SELECT 1 FROM public.prompts WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'skills' THEN
      SELECT EXISTS(SELECT 1 FROM public.skills WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'workflows' THEN
      SELECT EXISTS(SELECT 1 FROM public.workflows WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'claws' THEN
      SELECT EXISTS(SELECT 1 FROM public.claws WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSE
      slug_exists := FALSE;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$;

-- Create set_claw_slug function
CREATE OR REPLACE FUNCTION public.set_claw_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'claws', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'claws', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Slug generation triggers
CREATE TRIGGER set_claw_slug_on_insert
  BEFORE INSERT ON public.claws
  FOR EACH ROW
  EXECUTE FUNCTION set_claw_slug();

CREATE TRIGGER set_claw_slug_on_update
  BEFORE UPDATE ON public.claws
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title OR NEW.slug IS NULL)
  EXECUTE FUNCTION set_claw_slug();

-- Updated_at trigger
CREATE TRIGGER update_claws_updated_at
  BEFORE UPDATE ON public.claws
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create claw_reviews table
CREATE TABLE public.claw_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claw_id UUID NOT NULL REFERENCES public.claws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(claw_id, user_id)
);

-- Enable RLS on reviews
ALTER TABLE public.claw_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view claw reviews"
ON public.claw_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create their own claw reviews"
ON public.claw_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claw reviews"
ON public.claw_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claw reviews"
ON public.claw_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Function to get similar claws (for semantic search)
CREATE OR REPLACE FUNCTION get_similar_claws(target_id UUID, match_limit INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  tags TEXT[],
  author_id UUID,
  team_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.tags,
    c.author_id,
    c.team_id,
    1 - (c.embedding <=> (SELECT embedding FROM claws WHERE claws.id = target_id)) as similarity
  FROM claws c
  WHERE c.id != target_id
    AND c.embedding IS NOT NULL
    AND c.published = true
  ORDER BY c.embedding <=> (SELECT embedding FROM claws WHERE claws.id = target_id)
  LIMIT match_limit;
END;
$$;

-- Function to search claws semantically
CREATE OR REPLACE FUNCTION search_claws_semantic(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  content TEXT,
  tags TEXT[],
  author_id UUID,
  published BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.content,
    c.tags,
    c.author_id,
    c.published,
    c.created_at,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM claws c
  WHERE c.published = true
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Update is_item_public function to include claws
CREATE OR REPLACE FUNCTION is_item_public(p_item_type TEXT, p_item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND is_public = true);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'claw' THEN
    RETURN EXISTS (SELECT 1 FROM claws WHERE id = p_item_id AND published = true);
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Update is_item_owner function to include claws
CREATE OR REPLACE FUNCTION is_item_owner(p_item_type TEXT, p_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'claw' THEN
    RETURN EXISTS (SELECT 1 FROM claws WHERE id = p_item_id AND author_id = p_user_id);
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Update is_team_member_for_item function to include claws
CREATE OR REPLACE FUNCTION is_team_member_for_item(p_item_type TEXT, p_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
BEGIN
  IF p_item_type = 'prompt' THEN
    SELECT team_id INTO v_team_id FROM prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT team_id INTO v_team_id FROM skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT team_id INTO v_team_id FROM workflows WHERE id = p_item_id;
  ELSIF p_item_type = 'claw' THEN
    SELECT team_id INTO v_team_id FROM claws WHERE id = p_item_id;
  ELSE
    RETURN false;
  END IF;
  
  IF v_team_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (SELECT 1 FROM team_members WHERE team_id = v_team_id AND user_id = p_user_id);
END;
$$;