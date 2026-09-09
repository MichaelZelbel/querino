-- Finding 1 of the 2026-09-08 audit.
--
-- update_prompt_slug and update_prompt_kit_slug took the user they authorised
-- against from a parameter the browser filled in. Author ids are public (every
-- card joins the author's profile), and the admin's id is in this repository,
-- so anyone signed in could rename any prompt or kit and park its old address
-- as a redirect. It is the mistake CLAUDE.md forbids for edge functions, moved
-- into SQL: identity came from the request, not from the session.
--
-- The parameter stays, with a default, so a client built before this change
-- still calls the same signature. It is no longer trusted: the caller is
-- auth.uid(), and a value that names someone else is refused rather than
-- silently reinterpreted.

CREATE OR REPLACE FUNCTION public.update_prompt_slug(
  p_prompt_id uuid,
  p_new_slug text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_prompt RECORD;
  v_normalized_slug text;
  v_existing_active uuid;
  v_existing_redirect uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_user_id IS NOT NULL AND p_user_id <> v_uid THEN
    RETURN jsonb_build_object('error', 'Not authorized to edit this slug');
  END IF;

  SELECT id, slug, author_id INTO v_prompt
  FROM public.prompts
  WHERE id = p_prompt_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Prompt not found');
  END IF;

  IF v_prompt.author_id <> v_uid AND NOT public.is_admin(v_uid) THEN
    RETURN jsonb_build_object('error', 'Not authorized to edit this slug');
  END IF;

  v_normalized_slug := public.generate_slug(p_new_slug);

  IF v_normalized_slug IS NULL OR v_normalized_slug = '' OR v_normalized_slug = '-' THEN
    RETURN jsonb_build_object('error', 'Invalid slug: becomes empty after normalization');
  END IF;

  IF v_prompt.slug = v_normalized_slug THEN
    RETURN jsonb_build_object('slug', v_normalized_slug, 'changed', false);
  END IF;

  SELECT id INTO v_existing_active
  FROM public.prompts
  WHERE slug = v_normalized_slug AND id <> p_prompt_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'This slug is already in use by another prompt');
  END IF;

  SELECT prompt_id INTO v_existing_redirect
  FROM public.prompt_slug_redirects
  WHERE old_slug = v_normalized_slug AND prompt_id <> p_prompt_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'This slug is reserved as a historical redirect for another prompt');
  END IF;

  DELETE FROM public.prompt_slug_redirects
  WHERE old_slug = v_normalized_slug AND prompt_id = p_prompt_id;

  INSERT INTO public.prompt_slug_redirects (prompt_id, old_slug)
  VALUES (p_prompt_id, v_prompt.slug)
  ON CONFLICT (old_slug) DO UPDATE SET prompt_id = p_prompt_id;

  UPDATE public.prompts SET slug = v_normalized_slug WHERE id = p_prompt_id;

  RETURN jsonb_build_object('slug', v_normalized_slug, 'changed', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_prompt_kit_slug(
  p_prompt_kit_id uuid,
  p_new_slug text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_kit RECORD;
  v_normalized_slug text;
  v_existing_active uuid;
  v_existing_redirect uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_user_id IS NOT NULL AND p_user_id <> v_uid THEN
    RETURN jsonb_build_object('error', 'Not authorized to edit this slug');
  END IF;

  SELECT id, slug, author_id INTO v_kit
  FROM public.prompt_kits
  WHERE id = p_prompt_kit_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Prompt kit not found');
  END IF;

  IF v_kit.author_id <> v_uid AND NOT public.is_admin(v_uid) THEN
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
  WHERE slug = v_normalized_slug AND id <> p_prompt_kit_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'This slug is already in use by another prompt kit');
  END IF;

  SELECT prompt_kit_id INTO v_existing_redirect
  FROM public.prompt_kit_slug_redirects
  WHERE old_slug = v_normalized_slug AND prompt_kit_id <> p_prompt_kit_id
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

-- A visitor without a session has nothing to rename.
REVOKE EXECUTE ON FUNCTION public.update_prompt_slug(uuid, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_prompt_kit_slug(uuid, text, uuid) FROM anon;
