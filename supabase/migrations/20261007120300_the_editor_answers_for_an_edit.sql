-- Whoever edits an artifact answers for the edit, not its author (2026-10-07
-- review).
--
-- What was wrong. A Premium team member may rewrite a teammate's team
-- artifact (policy "Premium team members can update team ..."). Both checks
-- that guard publishing looked only at NEW.author_id:
--   * refuse_publish_while_suspended let a suspended member publish through a
--     teammate's artifact, because it asked whether the AUTHOR was suspended.
--     20260930120000 promised "whichever door it uses".
--   * enqueue_moderation_on_publish filed the AI review under the author, and
--     ai-moderate-content strikes and emails the queue row's user_id. A member
--     who wrote violating text into a teammate's public prompt got the
--     teammate the strike, the email and, after five, the suspension.
--
-- How it was measured. Both function bodies read from production. Today there
-- is one team with two members and no suspension, so nobody has been struck
-- for someone else's words.
--
-- What it changes.
--   * refuse_publish_while_suspended also refuses when the person making the
--     change (auth.uid()) is suspended. Service-role writes have no auth.uid()
--     and are judged by the author as before (the MCP server only lets an
--     author edit their own artifacts).
--   * moderation_review_queue.editor_id names who wrote the text under review:
--     auth.uid() when a person made the change, else the author. A later edit
--     while a review is still pending moves the row to the newer editor,
--     because the worker classifies the text as it is when it runs.
--     user_id stays the author: it is what the worker checks the artifact
--     against before it unpublishes anything.
--   * editors_mixed records that more than one person changed the text while
--     the review was pending. The worker then still takes a violation down
--     and tells the author, but strikes nobody automatically: the newest
--     editor may only have fixed a typo in someone else's words.
--   * claim_moderation_review_queue returns editor_id, which the worker
--     strikes and emails instead of user_id.

ALTER TABLE public.moderation_review_queue
  ADD COLUMN IF NOT EXISTS editor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.moderation_review_queue
  ADD COLUMN IF NOT EXISTS editors_mixed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.moderation_review_queue.editors_mixed IS
  'True when more than one person changed the text while this review was pending. The AI review then strikes nobody automatically.';

COMMENT ON COLUMN public.moderation_review_queue.editor_id IS
  'Who wrote the text under review: the signed-in editor, else the author. The AI review strikes and emails this person. NULL on rows filed before 2026-10-07 and when the editor deleted their account; the worker then uses user_id.';

CREATE OR REPLACE FUNCTION public.refuse_publish_while_suspended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
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
  -- embedding, never something anyone is publishing.
  IF TG_OP = 'UPDATE' AND v_was_public
     AND NEW.title       IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.content     IS NOT DISTINCT FROM OLD.content THEN
    RETURN NEW;
  END IF;

  -- The author, and whoever is making the change if that is someone else.
  IF EXISTS (
    SELECT 1 FROM public.user_suspensions s
     WHERE s.user_id IN (NEW.author_id, auth.uid())
       AND s.suspended
       AND (s.suspended_until IS NULL OR s.suspended_until > now())
  ) THEN
    RAISE EXCEPTION 'This account is suspended and cannot publish. Contact support@querino.ai.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.refuse_publish_while_suspended() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refuse_publish_while_suspended() FROM anon;
REVOKE ALL ON FUNCTION public.refuse_publish_while_suspended() FROM authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_moderation_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_item_type  text;
  v_now_public boolean;
  v_was_public boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'prompts' THEN
    v_item_type  := 'prompt';
    v_now_public := coalesce(NEW.is_public, false);
    IF TG_OP = 'UPDATE' THEN v_was_public := coalesce(OLD.is_public, false); END IF;
  ELSE
    v_item_type := CASE TG_TABLE_NAME
                     WHEN 'skills'      THEN 'skill'
                     WHEN 'workflows'   THEN 'workflow'
                     WHEN 'prompt_kits' THEN 'prompt_kit'
                   END;
    v_now_public := coalesce(NEW.published, false);
    IF TG_OP = 'UPDATE' THEN v_was_public := coalesce(OLD.published, false); END IF;
  END IF;

  IF v_item_type IS NULL OR NOT v_now_public OR NEW.author_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' AND v_was_public
     AND NEW.title       IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.content     IS NOT DISTINCT FROM OLD.content THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.moderation_review_queue
    (item_type, item_id, user_id, editor_id, content_snapshot, status)
  VALUES
    (v_item_type, NEW.id, NEW.author_id, coalesce(auth.uid(), NEW.author_id),
     left(concat_ws(E'\n\n', NEW.title, NEW.description, NEW.content), 5000),
     'pending')
  ON CONFLICT (item_type, item_id) WHERE status = 'pending' DO UPDATE
    SET editors_mixed = moderation_review_queue.editors_mixed
          OR coalesce(moderation_review_queue.editor_id, moderation_review_queue.user_id)
             IS DISTINCT FROM EXCLUDED.editor_id,
        editor_id = EXCLUDED.editor_id,
        content_snapshot = EXCLUDED.content_snapshot;

  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.enqueue_moderation_on_publish() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_moderation_on_publish() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_moderation_on_publish() FROM authenticated;

-- The return type gains a column, which CREATE OR REPLACE cannot do.
DROP FUNCTION IF EXISTS public.claim_moderation_review_queue(integer, interval);

CREATE FUNCTION public.claim_moderation_review_queue(
  batch_size integer DEFAULT 5,
  stale_after interval DEFAULT '00:10:00'::interval
)
RETURNS TABLE(id uuid, item_type text, item_id uuid, user_id uuid,
              editor_id uuid, editors_mixed boolean, content_snapshot text,
              retry_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
  WITH claimable AS (
    SELECT q.id
      FROM public.moderation_review_queue q
     WHERE q.status = 'pending'
        OR (q.status = 'processing'
            AND q.claimed_at IS NOT NULL
            AND q.claimed_at < now() - stale_after)
     ORDER BY q.created_at, q.id
     LIMIT greatest(batch_size, 0)
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.moderation_review_queue q
     SET status = 'processing',
         claimed_at = now()
    FROM claimable c
   WHERE q.id = c.id
  RETURNING q.id, q.item_type, q.item_id, q.user_id, q.editor_id,
            q.editors_mixed, q.content_snapshot, q.retry_count;
$fn$;

REVOKE ALL ON FUNCTION public.claim_moderation_review_queue(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_moderation_review_queue(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION public.claim_moderation_review_queue(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_moderation_review_queue(integer, interval) TO service_role;
