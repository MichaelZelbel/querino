
-- 1. RPC: update_prompt_kit_slug (analog update_prompt_slug)
CREATE OR REPLACE FUNCTION public.update_prompt_kit_slug(
  p_prompt_kit_id uuid,
  p_new_slug text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_kit RECORD;
  v_normalized_slug text;
  v_existing_active uuid;
  v_existing_redirect uuid;
  v_is_admin boolean;
BEGIN
  SELECT id, slug, author_id INTO v_kit
  FROM public.prompt_kits
  WHERE id = p_prompt_kit_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Prompt kit not found');
  END IF;

  v_is_admin := public.is_admin(p_user_id);
  IF v_kit.author_id != p_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Not authorized to edit this slug');
  END IF;

  v_normalized_slug := public.generate_slug(p_new_slug);

  IF v_normalized_slug IS NULL OR v_normalized_slug = '' OR v_normalized_slug = '-' THEN
    RETURN jsonb_build_object('error', 'Invalid slug: becomes empty after normalization');
  END IF;

  IF v_kit.slug = v_normalized_slug THEN
    RETURN jsonb_build_object('slug', v_normalized_slug, 'changed', false);
  END IF;

  SELECT id INTO v_existing_active
  FROM public.prompt_kits
  WHERE slug = v_normalized_slug AND id != p_prompt_kit_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'This slug is already in use by another prompt kit');
  END IF;

  SELECT prompt_kit_id INTO v_existing_redirect
  FROM public.prompt_kit_slug_redirects
  WHERE old_slug = v_normalized_slug AND prompt_kit_id != p_prompt_kit_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'This slug is reserved as a historical redirect for another prompt kit');
  END IF;

  DELETE FROM public.prompt_kit_slug_redirects
  WHERE old_slug = v_normalized_slug AND prompt_kit_id = p_prompt_kit_id;

  INSERT INTO public.prompt_kit_slug_redirects (prompt_kit_id, old_slug)
  VALUES (p_prompt_kit_id, v_kit.slug)
  ON CONFLICT (old_slug) DO UPDATE SET prompt_kit_id = p_prompt_kit_id;

  UPDATE public.prompt_kits SET slug = v_normalized_slug WHERE id = p_prompt_kit_id;

  RETURN jsonb_build_object('slug', v_normalized_slug, 'changed', true);
END;
$function$;

-- 2. Ensure prompt_kit_slug_redirects has unique constraint on old_slug
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'prompt_kit_slug_redirects_old_slug_key'
  ) THEN
    ALTER TABLE public.prompt_kit_slug_redirects
      ADD CONSTRAINT prompt_kit_slug_redirects_old_slug_key UNIQUE (old_slug);
  END IF;
END $$;
