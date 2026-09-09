-- Findings 24 to 27 of the 2026-09-08 audit. The low ones, cleared so the list
-- is empty rather than short.
--
-- 24. The predicates that answer questions about a person took the person as an
--     argument, and PostgREST served every one of them to the anonymous key.
--     is_admin, is_premium_user, get_user_role, has_role and the three team
--     ones were therefore an oracle: POST /rpc/get_user_role with any author id
--     (they are on every public card) returned 'admin', 'premium' or 'free'.
--     That is exactly what 20260823174224 revoked the profile columns to stop.
--     Execute goes away for anon only. Signed-in callers keep it because the
--     policies they are subject to call these functions as themselves, and a
--     signed-in caller asking about their own account learns nothing new.
--     Checked before writing this: with the revoke in place, an anon session
--     still reads the same 101 prompts, 2 profiles and 4 reviews it reads now.
--
-- 25. encrypt_user_credential took NEW.credential_secret_id from whoever wrote
--     the row. The column is not readable by users, so a secret id had to leak
--     first, but if one did, pointing your own credential row at it made the
--     GitHub sync read someone else's token, and deleting your row deleted
--     their secret. The id is now decided by the trigger alone.
--
-- 26. get_similar_prompts, get_similar_skills and get_similar_workflows read
--     the target's embedding with no visibility check, so a caller holding the
--     id of a private artifact got a list of the public artifacts most like it.
--     get_similar_prompt_kits already refused this; the other three now match.
--
-- 27. set_prompt_slug only generated on INSERT, but its update trigger still
--     fired WHEN NEW.slug IS NULL, and slug is nullable. An owner writing
--     slug = null therefore left a prompt with no address, unreachable and
--     unsyncable. It regenerates instead. generate_unique_slug also never
--     looked at the redirect tables, so a new artifact could take a slug that
--     is a live redirect to an older one and quietly steal it.

-- ---------------------------------------------------------------------------
-- 24. Anonymous callers cannot ask about a person
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_premium_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_admin_or_owner(uuid, uuid) FROM anon;

-- ---------------------------------------------------------------------------
-- 25. The vault secret id is the trigger's to set
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.encrypt_user_credential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $fn$
DECLARE
  v_secret_id uuid;
BEGIN
  -- Whatever the writer put in this column, the row keeps the secret it
  -- already had, or gets a new one below. A client cannot aim it.
  NEW.credential_secret_id :=
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.credential_secret_id ELSE NULL END;

  -- Nothing new supplied: keep whatever secret the row already points at.
  -- This is the ordinary case for an UPDATE that only changes updated_at, and
  -- for the Settings page saving a form where the token box still holds the
  -- bullet placeholder rather than a token.
  IF NEW.credential_value IS NULL OR NEW.credential_value = '' THEN
    NEW.credential_value := NULL;
    RETURN NEW;
  END IF;

  v_secret_id := NEW.credential_secret_id;

  IF v_secret_id IS NULL THEN
    v_secret_id := vault.create_secret(
      NEW.credential_value,
      'user_credentials:' || NEW.id::text,
      'Querino ' || NEW.credential_type || ' credential'
    );
  ELSE
    PERFORM vault.update_secret(v_secret_id, NEW.credential_value);
  END IF;

  NEW.credential_secret_id := v_secret_id;

  -- The whole point. The row never holds the secret.
  NEW.credential_value := NULL;

  RETURN NEW;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 26. A private artifact is not a similarity oracle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_similar_prompts(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, category text, rating_avg numeric, rating_count integer, copies_count integer, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
  target_public boolean;
BEGIN
  SELECT p.embedding, p.is_public INTO target_embedding, target_public
  FROM public.prompts p
  WHERE p.id = target_id;

  IF target_embedding IS NULL OR target_public IS NOT TRUE THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.category,
    p.rating_avg,
    p.rating_count,
    p.copies_count,
    p.author_id,
    p.team_id,
    p.tags,
    1 - (p.embedding <=> target_embedding) as similarity
  FROM public.prompts p
  WHERE p.id != target_id
    AND p.is_public = true
    AND p.embedding IS NOT NULL
  ORDER BY p.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_similar_skills(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
  target_published boolean;
BEGIN
  SELECT s.embedding, s.published INTO target_embedding, target_published
  FROM public.skills s
  WHERE s.id = target_id;

  IF target_embedding IS NULL OR target_published IS NOT TRUE THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.author_id,
    s.team_id,
    s.tags,
    1 - (s.embedding <=> target_embedding) as similarity
  FROM public.skills s
  WHERE s.id != target_id
    AND s.published = true
    AND s.embedding IS NOT NULL
  ORDER BY s.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_similar_workflows(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
  target_published boolean;
BEGIN
  SELECT w.embedding, w.published INTO target_embedding, target_published
  FROM public.workflows w
  WHERE w.id = target_id;

  IF target_embedding IS NULL OR target_published IS NOT TRUE THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.description,
    w.author_id,
    w.team_id,
    w.tags,
    1 - (w.embedding <=> target_embedding) as similarity
  FROM public.workflows w
  WHERE w.id != target_id
    AND w.published = true
    AND w.embedding IS NOT NULL
  ORDER BY w.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 27. A prompt always has an address, and never someone else's
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_prompt_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $fn$
BEGIN
  -- On INSERT, and on any UPDATE that would leave the row without a slug.
  -- The update trigger fires WHEN NEW.slug IS NULL, and the column is
  -- nullable, so before this an owner could blank it and lose the page.
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompts', NEW.id);
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.generate_unique_slug(
  p_title text,
  p_table text,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
  slug_taken boolean;
BEGIN
  base_slug := public.generate_slug(p_title);
  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'untitled';
  END IF;
  final_slug := base_slug;

  LOOP
    IF p_table = 'prompts' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.prompts
         WHERE slug = final_slug AND (p_exclude_id IS NULL OR id <> p_exclude_id)
      ) OR EXISTS (
        -- A live redirect is an address in use. Handing it to a new artifact
        -- let that artifact quietly take over an older one's old address.
        SELECT 1 FROM public.prompt_slug_redirects
         WHERE old_slug = final_slug AND (p_exclude_id IS NULL OR prompt_id <> p_exclude_id)
      ) INTO slug_taken;
    ELSIF p_table = 'skills' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.skills
         WHERE slug = final_slug AND (p_exclude_id IS NULL OR id <> p_exclude_id)
      ) INTO slug_taken;
    ELSIF p_table = 'workflows' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.workflows
         WHERE slug = final_slug AND (p_exclude_id IS NULL OR id <> p_exclude_id)
      ) INTO slug_taken;
    ELSIF p_table = 'prompt_kits' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.prompt_kits
         WHERE slug = final_slug AND (p_exclude_id IS NULL OR id <> p_exclude_id)
      ) OR EXISTS (
        SELECT 1 FROM public.prompt_kit_slug_redirects
         WHERE old_slug = final_slug AND (p_exclude_id IS NULL OR prompt_kit_id <> p_exclude_id)
      ) INTO slug_taken;
    ELSE
      -- An unknown table name used to mean "nothing is taken", which is how
      -- 'prompt_kit' (no s) silently disabled suffixing for every kit.
      RAISE EXCEPTION 'generate_unique_slug does not know the table %', p_table;
    END IF;

    EXIT WHEN NOT slug_taken;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$fn$;
