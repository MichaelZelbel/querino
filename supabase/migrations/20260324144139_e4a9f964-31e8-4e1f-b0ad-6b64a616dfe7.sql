
-- 1. Create prompt_slug_redirects table for redirect history
CREATE TABLE public.prompt_slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  old_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (old_slug)
);

-- 2. Enable RLS
ALTER TABLE public.prompt_slug_redirects ENABLE ROW LEVEL SECURITY;

-- 3. Anyone can read redirects (needed for routing)
CREATE POLICY "Anyone can read slug redirects"
  ON public.prompt_slug_redirects
  FOR SELECT
  TO public
  USING (true);

-- 4. Only service_role can insert/update/delete redirects (done via DB function)
CREATE POLICY "Service role manages redirects"
  ON public.prompt_slug_redirects
  FOR ALL
  TO service_role
  USING (true);

-- 5. Create index for fast lookups
CREATE INDEX idx_prompt_slug_redirects_old_slug ON public.prompt_slug_redirects (old_slug);
CREATE INDEX idx_prompt_slug_redirects_prompt_id ON public.prompt_slug_redirects (prompt_id);

-- 6. Update set_prompt_slug trigger to ONLY generate slug on INSERT (not on title change)
CREATE OR REPLACE FUNCTION public.set_prompt_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only auto-generate slug on INSERT when slug is null/empty
  IF TG_OP = 'INSERT' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompts', NEW.id);
  END IF;
  -- On UPDATE: do NOT auto-change slug when title changes
  RETURN NEW;
END;
$function$;

-- 7. Create a SECURITY DEFINER function to update slug with redirect history
-- This handles: validation, uniqueness check (active + historical), atomic redirect creation
CREATE OR REPLACE FUNCTION public.update_prompt_slug(
  p_prompt_id uuid,
  p_new_slug text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_prompt RECORD;
  v_normalized_slug text;
  v_existing_active uuid;
  v_existing_redirect uuid;
  v_is_admin boolean;
BEGIN
  -- 1. Fetch the prompt
  SELECT id, slug, author_id INTO v_prompt
  FROM public.prompts
  WHERE id = p_prompt_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Prompt not found');
  END IF;

  -- 2. Check authorization: must be owner or admin
  v_is_admin := public.is_admin(p_user_id);
  IF v_prompt.author_id != p_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Not authorized to edit this slug');
  END IF;

  -- 3. Normalize the slug using generate_slug
  v_normalized_slug := public.generate_slug(p_new_slug);

  -- 4. Reject if empty/invalid after normalization
  IF v_normalized_slug IS NULL OR v_normalized_slug = '' OR v_normalized_slug = '-' THEN
    RETURN jsonb_build_object('error', 'Invalid slug: becomes empty after normalization');
  END IF;

  -- 5. If slug hasn't changed, no-op
  IF v_prompt.slug = v_normalized_slug THEN
    RETURN jsonb_build_object('slug', v_normalized_slug, 'changed', false);
  END IF;

  -- 6. Check uniqueness against active slugs (excluding this prompt)
  SELECT id INTO v_existing_active
  FROM public.prompts
  WHERE slug = v_normalized_slug AND id != p_prompt_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'This slug is already in use by another prompt');
  END IF;

  -- 7. Check uniqueness against historical redirects (excluding this prompt's own history)
  SELECT prompt_id INTO v_existing_redirect
  FROM public.prompt_slug_redirects
  WHERE old_slug = v_normalized_slug AND prompt_id != p_prompt_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'This slug is reserved as a historical redirect for another prompt');
  END IF;

  -- 8. Remove any existing redirect for this prompt that points to the new slug
  --    (in case user is reverting to a previous slug)
  DELETE FROM public.prompt_slug_redirects
  WHERE old_slug = v_normalized_slug AND prompt_id = p_prompt_id;

  -- 9. Save the old slug as a redirect
  INSERT INTO public.prompt_slug_redirects (prompt_id, old_slug)
  VALUES (p_prompt_id, v_prompt.slug)
  ON CONFLICT (old_slug) DO UPDATE SET prompt_id = p_prompt_id;

  -- 10. Update the prompt slug
  UPDATE public.prompts SET slug = v_normalized_slug WHERE id = p_prompt_id;

  RETURN jsonb_build_object('slug', v_normalized_slug, 'changed', true);
END;
$function$;
