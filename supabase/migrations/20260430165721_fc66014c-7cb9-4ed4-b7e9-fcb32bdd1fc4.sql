-- ============================================================================
-- Prompt Kits: Feature parity migration (versions, suggestions, collections,
-- comments, activity, slug-trigger, ratings, RLS for new tables)
-- ============================================================================

-- 1) prompt_kit_versions
CREATE TABLE IF NOT EXISTS public.prompt_kit_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_kit_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  change_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_kit_versions_kit_id
  ON public.prompt_kit_versions (prompt_kit_id, version_number DESC);

ALTER TABLE public.prompt_kit_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their own prompt kits"
  ON public.prompt_kit_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.prompt_kits
    WHERE prompt_kits.id = prompt_kit_versions.prompt_kit_id
      AND prompt_kits.author_id = auth.uid()
  ));

CREATE POLICY "Users can insert versions for their own prompt kits"
  ON public.prompt_kit_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.prompt_kits
    WHERE prompt_kits.id = prompt_kit_versions.prompt_kit_id
      AND prompt_kits.author_id = auth.uid()
  ));

CREATE POLICY "Users can delete versions of their own prompt kits"
  ON public.prompt_kit_versions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.prompt_kits
    WHERE prompt_kits.id = prompt_kit_versions.prompt_kit_id
      AND prompt_kits.author_id = auth.uid()
  ));

-- 2) Slug auto-generation trigger for prompt_kits (mirrors prompts behavior)
CREATE OR REPLACE FUNCTION public.set_prompt_kit_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompt_kit', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_prompt_kit_slug ON public.prompt_kits;
CREATE TRIGGER trg_set_prompt_kit_slug
  BEFORE INSERT OR UPDATE OF title, slug ON public.prompt_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_prompt_kit_slug();

-- Backfill slugs for existing rows missing them
UPDATE public.prompt_kits
SET slug = public.generate_unique_slug(title, 'prompt_kit', id)
WHERE slug IS NULL OR slug = '';

-- 3) Updated_at trigger
DROP TRIGGER IF EXISTS trg_prompt_kits_updated_at ON public.prompt_kits;
CREATE TRIGGER trg_prompt_kits_updated_at
  BEFORE UPDATE ON public.prompt_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Rating aggregation trigger for prompt_kit_reviews
CREATE OR REPLACE FUNCTION public.update_prompt_kit_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kit_id uuid;
BEGIN
  v_kit_id := COALESCE(NEW.prompt_kit_id, OLD.prompt_kit_id);
  UPDATE public.prompt_kits
  SET rating_avg = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.prompt_kit_reviews
        WHERE prompt_kit_id = v_kit_id
      ), 0),
      rating_count = (
        SELECT COUNT(*) FROM public.prompt_kit_reviews
        WHERE prompt_kit_id = v_kit_id
      )
  WHERE id = v_kit_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prompt_kit_rating_ins ON public.prompt_kit_reviews;
DROP TRIGGER IF EXISTS trg_prompt_kit_rating_upd ON public.prompt_kit_reviews;
DROP TRIGGER IF EXISTS trg_prompt_kit_rating_del ON public.prompt_kit_reviews;
CREATE TRIGGER trg_prompt_kit_rating_ins AFTER INSERT ON public.prompt_kit_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_prompt_kit_rating();
CREATE TRIGGER trg_prompt_kit_rating_upd AFTER UPDATE ON public.prompt_kit_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_prompt_kit_rating();
CREATE TRIGGER trg_prompt_kit_rating_del AFTER DELETE ON public.prompt_kit_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_prompt_kit_rating();

-- 5) prompt_kit_coach_messages (chat history isolation per session)
CREATE TABLE IF NOT EXISTS public.prompt_kit_coach_messages (
  id bigserial PRIMARY KEY,
  session_id varchar NOT NULL,
  message jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prompt_kit_coach_messages_session
  ON public.prompt_kit_coach_messages (session_id);

ALTER TABLE public.prompt_kit_coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read prompt kit coach messages"
  ON public.prompt_kit_coach_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert prompt kit coach messages"
  ON public.prompt_kit_coach_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete prompt kit coach messages"
  ON public.prompt_kit_coach_messages FOR DELETE TO authenticated USING (true);

-- 6) Slug history trigger (mirrors prompts) — record old slug on change
CREATE OR REPLACE FUNCTION public.record_prompt_kit_slug_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug AND OLD.slug IS NOT NULL AND OLD.slug <> '' THEN
    INSERT INTO public.prompt_kit_slug_redirects (prompt_kit_id, old_slug)
    VALUES (NEW.id, OLD.slug)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prompt_kit_slug_history ON public.prompt_kits;
CREATE TRIGGER trg_prompt_kit_slug_history
  AFTER UPDATE OF slug ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.record_prompt_kit_slug_change();