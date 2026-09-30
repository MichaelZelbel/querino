-- A suspended account cannot publish, whichever door it uses (2026-09-30 audit).
--
-- The suspension check lives only in the moderate-content edge function, which
-- the website calls before it saves. The MCP server's create_*/update_* tools
-- and a plain PostgREST PATCH never call it, so a suspended account could set
-- is_public/published = true, or rewrite a public artifact, from either. The
-- AI review still runs on those (enqueue_moderation_on_publish), but the
-- suspension, which exists to stop exactly that account publishing, did not.
--
-- The rule moderate-content applies, in the database: an artifact may not
-- become public, be created public, or have its text changed while public,
-- when its author is suspended and the suspension has not run out. Taking an
-- artifact private, and every write to a private one, stay allowed.

CREATE OR REPLACE FUNCTION public.refuse_publish_while_suspended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now_public boolean;
  v_was_public boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'prompts' THEN
    v_now_public := coalesce(NEW.is_public, false);
    IF TG_OP = 'UPDATE' THEN v_was_public := coalesce(OLD.is_public, false); END IF;
  ELSE
    v_now_public := coalesce(NEW.published, false);
    IF TG_OP = 'UPDATE' THEN v_was_public := coalesce(OLD.published, false); END IF;
  END IF;

  IF NOT v_now_public OR NEW.author_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Already public and the text is unchanged: a counter, a sync stamp or an
  -- embedding, never something the author is publishing.
  IF TG_OP = 'UPDATE' AND v_was_public
     AND NEW.title       IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.content     IS NOT DISTINCT FROM OLD.content THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_suspensions s
     WHERE s.user_id = NEW.author_id
       AND s.suspended
       AND (s.suspended_until IS NULL OR s.suspended_until > now())
  ) THEN
    RAISE EXCEPTION 'This account is suspended and cannot publish. Contact support@querino.ai.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refuse_publish_while_suspended() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS refuse_publish_while_suspended ON public.prompts;
CREATE TRIGGER refuse_publish_while_suspended
  BEFORE INSERT OR UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.refuse_publish_while_suspended();

DROP TRIGGER IF EXISTS refuse_publish_while_suspended ON public.skills;
CREATE TRIGGER refuse_publish_while_suspended
  BEFORE INSERT OR UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.refuse_publish_while_suspended();

DROP TRIGGER IF EXISTS refuse_publish_while_suspended ON public.workflows;
CREATE TRIGGER refuse_publish_while_suspended
  BEFORE INSERT OR UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.refuse_publish_while_suspended();

DROP TRIGGER IF EXISTS refuse_publish_while_suspended ON public.prompt_kits;
CREATE TRIGGER refuse_publish_while_suspended
  BEFORE INSERT OR UPDATE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.refuse_publish_while_suspended();
