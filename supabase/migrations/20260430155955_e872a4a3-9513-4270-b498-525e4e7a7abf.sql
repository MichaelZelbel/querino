
-- =====================================================================
-- Prompt Kits: new artifact type that bundles multiple prompts in a
-- single Markdown document, separated by `## Prompt: <Title>` headings.
-- Mirrors the structure of `skills` (published flag, author/team scope,
-- embedding column, slug + redirects, ratings, pins, versions, FTS,
-- semantic search, menerio sync, polymorphic helpers).
-- =====================================================================

-- 1. Main table -------------------------------------------------------
CREATE TABLE public.prompt_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  team_id uuid,
  title text NOT NULL,
  description text,
  content text NOT NULL DEFAULT '',
  category text,
  tags text[] DEFAULT '{}'::text[],
  language text NOT NULL DEFAULT 'en',
  published boolean DEFAULT false,
  rating_avg numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  slug text,
  embedding vector(1536),
  menerio_synced boolean NOT NULL DEFAULT false,
  menerio_note_id text,
  menerio_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX prompt_kits_slug_unique ON public.prompt_kits(slug) WHERE slug IS NOT NULL;
CREATE INDEX prompt_kits_author_id_idx ON public.prompt_kits(author_id);
CREATE INDEX prompt_kits_team_id_idx ON public.prompt_kits(team_id);
CREATE INDEX prompt_kits_published_idx ON public.prompt_kits(published) WHERE published = true;
CREATE INDEX prompt_kits_embedding_idx ON public.prompt_kits USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX prompt_kits_fts_idx ON public.prompt_kits USING gin (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(content,''))
);

ALTER TABLE public.prompt_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published prompt kits are viewable by everyone"
  ON public.prompt_kits FOR SELECT
  USING (published = true);

CREATE POLICY "Users can view their own prompt kits"
  ON public.prompt_kits FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own prompt kits"
  ON public.prompt_kits FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own prompt kits"
  ON public.prompt_kits FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own prompt kits"
  ON public.prompt_kits FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Premium team members can view team prompt kits"
  ON public.prompt_kits FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    AND is_premium_user(auth.uid())
  );

CREATE POLICY "Premium team members can create team prompt kits"
  ON public.prompt_kits FOR INSERT
  WITH CHECK (
    team_id IS NULL
    OR (
      team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
      AND is_premium_user(auth.uid())
    )
  );

CREATE POLICY "Premium team members can update team prompt kits"
  ON public.prompt_kits FOR UPDATE
  USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    AND is_premium_user(auth.uid())
  );

CREATE POLICY "Premium team members can delete team prompt kits"
  ON public.prompt_kits FOR DELETE
  USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    AND is_premium_user(auth.uid())
  );

-- updated_at trigger
CREATE TRIGGER prompt_kits_updated_at
  BEFORE UPDATE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Pins -------------------------------------------------------------
CREATE TABLE public.prompt_kit_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt_kit_id uuid NOT NULL REFERENCES public.prompt_kits(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, prompt_kit_id)
);

ALTER TABLE public.prompt_kit_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt kit pins"
  ON public.prompt_kit_pins FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prompt kit pins"
  ON public.prompt_kit_pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompt kit pins"
  ON public.prompt_kit_pins FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Reviews ----------------------------------------------------------
CREATE TABLE public.prompt_kit_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_kit_id uuid NOT NULL REFERENCES public.prompt_kits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prompt_kit_id, user_id)
);

ALTER TABLE public.prompt_kit_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prompt kit reviews"
  ON public.prompt_kit_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own prompt kit reviews"
  ON public.prompt_kit_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompt kit reviews"
  ON public.prompt_kit_reviews FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompt kit reviews"
  ON public.prompt_kit_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER prompt_kit_reviews_updated_at
  BEFORE UPDATE ON public.prompt_kit_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Slug redirects ---------------------------------------------------
CREATE TABLE public.prompt_kit_slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_kit_id uuid NOT NULL REFERENCES public.prompt_kits(id) ON DELETE CASCADE,
  old_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (old_slug)
);

ALTER TABLE public.prompt_kit_slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prompt kit slug redirects"
  ON public.prompt_kit_slug_redirects FOR SELECT USING (true);
CREATE POLICY "Service role manages prompt kit redirects"
  ON public.prompt_kit_slug_redirects FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Slug autotrigger -------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_prompt_kit_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompt_kits', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prompt_kits_set_slug
  BEFORE INSERT OR UPDATE OF title ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.set_prompt_kit_slug();

-- Extend generate_unique_slug to know about prompt_kits
CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_title text, p_table text, p_exclude_id uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    ELSIF p_table = 'prompt_kits' THEN
      SELECT EXISTS(SELECT 1 FROM public.prompt_kits WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSE
      slug_exists := FALSE;
    END IF;

    EXIT WHEN NOT slug_exists;

    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN new_slug;
END;
$function$;

-- 6. Polymorphic helpers add 'prompt_kit' branch ----------------------
CREATE OR REPLACE FUNCTION public.is_item_public(p_item_type text, p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND is_public = true);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'prompt_kit' THEN
    RETURN EXISTS (SELECT 1 FROM prompt_kits WHERE id = p_item_id AND published = true);
  ELSE
    RETURN false;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_item_owner(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'prompt_kit' THEN
    RETURN EXISTS (SELECT 1 FROM prompt_kits WHERE id = p_item_id AND author_id = p_user_id);
  ELSE
    RETURN false;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_team_member_for_item(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_team_id UUID;
BEGIN
  IF p_item_type = 'prompt' THEN
    SELECT team_id INTO v_team_id FROM prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT team_id INTO v_team_id FROM skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT team_id INTO v_team_id FROM workflows WHERE id = p_item_id;
  ELSIF p_item_type = 'prompt_kit' THEN
    SELECT team_id INTO v_team_id FROM prompt_kits WHERE id = p_item_id;
  ELSE
    RETURN false;
  END IF;

  IF v_team_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (SELECT 1 FROM team_members WHERE team_id = v_team_id AND user_id = p_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_embedding(p_item_type text, p_item_id uuid, p_embedding vector)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_item_type = 'prompt' THEN
    UPDATE prompts SET embedding = p_embedding WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    UPDATE skills SET embedding = p_embedding WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    UPDATE workflows SET embedding = p_embedding WHERE id = p_item_id;
  ELSIF p_item_type = 'prompt_kit' THEN
    UPDATE prompt_kits SET embedding = p_embedding WHERE id = p_item_id;
  ELSE
    RAISE EXCEPTION 'Unknown item_type: %', p_item_type;
  END IF;
END;
$function$;

-- 7. Semantic + similarity RPCs ---------------------------------------
CREATE OR REPLACE FUNCTION public.search_prompt_kits_semantic(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.5,
  match_count integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  content text,
  tags text[],
  author_id uuid,
  published boolean,
  created_at timestamptz,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT pk.id, pk.title, pk.description, pk.content, pk.tags,
         pk.author_id, pk.published, pk.created_at,
         1 - (pk.embedding <=> query_embedding) AS similarity
  FROM public.prompt_kits pk
  WHERE pk.published = true
    AND pk.embedding IS NOT NULL
    AND 1 - (pk.embedding <=> query_embedding) > match_threshold
  ORDER BY pk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_similar_prompt_kits(
  target_id uuid,
  match_limit integer DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  author_id uuid,
  team_id uuid,
  tags text[],
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_embedding vector(1536);
  v_published boolean;
BEGIN
  SELECT pk.embedding, pk.published INTO v_embedding, v_published
  FROM public.prompt_kits pk WHERE pk.id = target_id;

  IF v_embedding IS NULL OR v_published IS NOT TRUE THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pk.id, pk.title, pk.description, pk.author_id, pk.team_id, pk.tags,
         1 - (pk.embedding <=> v_embedding) AS similarity
  FROM public.prompt_kits pk
  WHERE pk.id != target_id
    AND pk.published = true
    AND pk.embedding IS NOT NULL
  ORDER BY pk.embedding <=> v_embedding
  LIMIT match_limit;
END;
$$;

-- 8. Menerio sync trigger now also covers prompt_kits -----------------
CREATE OR REPLACE FUNCTION public.queue_menerio_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_artifact_type text;
BEGIN
  IF TG_TABLE_NAME = 'prompts' THEN
    v_artifact_type := 'prompt';
  ELSIF TG_TABLE_NAME = 'skills' THEN
    v_artifact_type := 'skill';
  ELSIF TG_TABLE_NAME = 'workflows' THEN
    v_artifact_type := 'workflow';
  ELSIF TG_TABLE_NAME = 'prompt_kits' THEN
    v_artifact_type := 'prompt_kit';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.menerio_synced = true AND OLD.author_id IS NOT NULL THEN
      DELETE FROM public.menerio_sync_queue
      WHERE artifact_type = v_artifact_type
        AND artifact_id = OLD.id
        AND status IN ('pending', 'delete_pending');

      INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
      VALUES (OLD.author_id, v_artifact_type, OLD.id, 'delete_pending');
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.menerio_synced = true AND NEW.author_id IS NOT NULL THEN
      IF OLD.title IS DISTINCT FROM NEW.title
         OR OLD.description IS DISTINCT FROM NEW.description
         OR OLD.content IS DISTINCT FROM NEW.content
         OR OLD.tags IS DISTINCT FROM NEW.tags
         OR OLD.category IS DISTINCT FROM NEW.category
      THEN
        INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
        VALUES (NEW.author_id, v_artifact_type, NEW.id, 'pending')
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER prompt_kits_menerio_sync
  AFTER UPDATE OR DELETE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.queue_menerio_sync();

-- 9. Allow 'prompt_kit' in menerio_integration default array
ALTER TABLE public.menerio_integration
  ALTER COLUMN sync_artifact_types SET DEFAULT ARRAY['prompt'::text, 'skill'::text, 'workflow'::text, 'prompt_kit'::text];
