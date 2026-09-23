-- Three findings of the 2026-09-23 review of the GitHub sync queue.
--
-- A. A claim abandoned on its last attempt stayed 'processing' for ever.
--
--    claim_github_sync_queue (20260908120500) re-claims a stale 'processing'
--    row only while attempts < max_attempts. A row whose third attempt died
--    with its isolate matched neither branch of the WHERE, so it sat in
--    'processing' with nothing ever looking at it again. The claim now marks
--    those rows 'failed' in the same statement.
--
-- B. Every artifact write queued a row, sync or no sync.
--
--    enqueue_github_sync inserted unconditionally, so every prompt, skill,
--    workflow and kit saved by anyone added a row that the worker then marked
--    'skipped' (github_sync_not_configured), and nothing ever deleted them. It
--    now inserts only when the target the worker would use has a repository:
--    the team's, when the artifact belongs to a team, otherwise the author's
--    own with github_sync_enabled. That is exactly loadGitHubSettings in
--    github-sync-worker, which also needs a stored token; the token is left
--    to the worker, because it lives in Vault and a missing one is rare.
--    Pruning the rows is in 20260923120200.
--
-- C. Moving an artifact to another owner left the old file behind.
--
--    When team_id or author_id changed, tg_github_sync_* queued an upsert for
--    the new owner only, so the file stayed in the old owner's repository for
--    good. The triggers now also queue a delete for the old target (the team,
--    or the author when there is no team) whenever the target changes. The
--    worker keys its "newest row wins" on artifact plus target, so the two
--    rows do not cancel each other out, and it leaves the file alone when the
--    new owner's sync already recorded the same repository path.

-- ---------------------------------------------------------------------------
-- A.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_github_sync_queue(
  batch_size integer DEFAULT 25,
  stale_after interval DEFAULT interval '10 minutes',
  max_attempts integer DEFAULT 3
)
RETURNS SETOF public.github_sync_queue
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH gave_up AS (
    UPDATE public.github_sync_queue q
       SET status = 'failed',
           last_error = 'gave up: abandoned in processing on its last attempt',
           updated_at = now()
     WHERE q.status = 'processing'
       AND q.attempts >= max_attempts
       AND q.claimed_at IS NOT NULL
       AND q.claimed_at < now() - stale_after
    RETURNING q.id
  ),
  claimable AS (
    SELECT q.id
      FROM public.github_sync_queue q
     WHERE (q.status IN ('pending', 'failed') AND q.attempts < max_attempts)
        OR (q.status = 'processing'
            AND q.attempts < max_attempts
            AND q.claimed_at IS NOT NULL
            AND q.claimed_at < now() - stale_after)
     ORDER BY q.created_at
     LIMIT greatest(batch_size, 0)
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.github_sync_queue q
     SET status = 'processing',
         attempts = q.attempts + 1,
         claimed_at = now(),
         updated_at = now()
    FROM claimable c
   WHERE q.id = c.id
  RETURNING q.*;
$$;

REVOKE ALL ON FUNCTION public.claim_github_sync_queue(integer, interval, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_github_sync_queue(integer, interval, integer) FROM anon;
REVOKE ALL ON FUNCTION public.claim_github_sync_queue(integer, interval, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_github_sync_queue(integer, interval, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- B. enqueue_github_sync as defined in 20260501194122 (20260908120100 only
--    changed its grants, which CREATE OR REPLACE keeps), plus the check.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_github_sync(
  p_artifact_type text,
  p_artifact_id uuid,
  p_operation text,
  p_owner_user_id uuid,
  p_team_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_team_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.teams t
       WHERE t.id = p_team_id
         AND nullif(btrim(t.github_repo), '') IS NOT NULL
    ) THEN
      RETURN;
    END IF;
  ELSIF p_owner_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = p_owner_user_id
       AND p.github_sync_enabled IS TRUE
       AND nullif(btrim(p.github_repo), '') IS NOT NULL
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.github_sync_queue (
    artifact_type, artifact_id, operation, owner_user_id, team_id, payload
  ) VALUES (
    p_artifact_type, p_artifact_id, p_operation, p_owner_user_id, p_team_id, COALESCE(p_payload, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_github_sync(text, uuid, text, uuid, uuid, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- C. The old target gets a delete when an artifact changes owner.
-- ---------------------------------------------------------------------------

-- The target is the team when there is one, otherwise the author; that is
-- the rule loadGitHubSettings uses. A change of author inside the same team
-- does not move the file, so it queues nothing extra.
CREATE OR REPLACE FUNCTION public.enqueue_github_sync_move(
  p_artifact_type text,
  p_artifact_id uuid,
  p_old_author uuid,
  p_old_team uuid,
  p_new_author uuid,
  p_new_team uuid,
  p_old_slug text,
  p_old_title text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (p_old_team IS NOT NULL AND p_old_team IS DISTINCT FROM p_new_team)
     OR (p_old_team IS NULL AND (p_new_team IS NOT NULL
                                 OR p_old_author IS DISTINCT FROM p_new_author)) THEN
    PERFORM public.enqueue_github_sync(
      p_artifact_type, p_artifact_id, 'delete', p_old_author, p_old_team,
      jsonb_build_object('slug', p_old_slug, 'title', p_old_title)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_github_sync_move(text, uuid, uuid, uuid, uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_github_sync_move(text, uuid, uuid, uuid, uuid, uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_github_sync_move(text, uuid, uuid, uuid, uuid, uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_github_sync_move(text, uuid, uuid, uuid, uuid, uuid, text, text) TO service_role;

-- The four trigger functions as defined in 20260501194122, each with the one
-- PERFORM enqueue_github_sync_move(...) line added before its upsert. The
-- triggers themselves are unchanged and keep pointing at these names.

CREATE OR REPLACE FUNCTION public.tg_github_sync_prompts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('prompt', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.is_public IS DISTINCT FROM OLD.is_public)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync_move('prompt', NEW.id, OLD.author_id, OLD.team_id, NEW.author_id, NEW.team_id, OLD.slug, OLD.title);
      PERFORM public.enqueue_github_sync('prompt', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('prompt', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_github_sync_skills()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('skill', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.published IS DISTINCT FROM OLD.published)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync_move('skill', NEW.id, OLD.author_id, OLD.team_id, NEW.author_id, NEW.team_id, OLD.slug, OLD.title);
      PERFORM public.enqueue_github_sync('skill', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('skill', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_github_sync_workflows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('workflow', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.published IS DISTINCT FROM OLD.published)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync_move('workflow', NEW.id, OLD.author_id, OLD.team_id, NEW.author_id, NEW.team_id, OLD.slug, OLD.title);
      PERFORM public.enqueue_github_sync('workflow', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('workflow', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_github_sync_prompt_kits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('prompt_kit', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.published IS DISTINCT FROM OLD.published)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync_move('prompt_kit', NEW.id, OLD.author_id, OLD.team_id, NEW.author_id, NEW.team_id, OLD.slug, OLD.title);
      PERFORM public.enqueue_github_sync('prompt_kit', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('prompt_kit', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
