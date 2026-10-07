-- A comment is moderated by the database, like an artifact (2026-10-07
-- review).
--
-- What was wrong. Only the browser moderated comments: CommentsSection calls
-- moderate-content before it inserts, and nothing on the table checks
-- anything. So:
--   * a suspended account, or anyone posting through the REST API directly,
--     skipped both tiers and could still comment;
--   * the AI review row the browser filed carried the ARTIFACT's id (the
--     comment had no id yet), and one pending row per item is allowed, so a
--     second comment on the same artifact before the next review run was
--     silently never reviewed;
--   * a comment the AI found in violation was never removed: the worker has
--     nothing to unpublish for a comment, yet struck the writer and mailed
--     them that "your artifact has been set to private".
--
-- How it was measured. Triggers and policies on comments read from
-- production: none moderates. The table holds 0 rows today.
--
-- What it changes.
--   * A suspended account cannot write or edit a comment, by any door.
--   * Every comment written or edited by a person files its own review row,
--     keyed by the comment's id. ai-moderate-content (same day) reads the
--     comment's current text, and on a violation replaces it with a removal
--     notice: deleting it would also delete every reply, which the parent_id
--     foreign key cascades. That replacement is a service-role write, which
--     files no new review.
--   * moderate-content no longer files comment rows of its own.

CREATE OR REPLACE FUNCTION public.refuse_comment_while_suspended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Taking one's own comment back is not commenting: a comment with replies
  -- is deleted by blanking it to this exact text (useComments.ts).
  IF TG_OP = 'UPDATE' AND NEW.content = '[This comment was deleted by its author.]' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_suspensions s
     WHERE s.user_id = auth.uid()
       AND s.suspended
       AND (s.suspended_until IS NULL OR s.suspended_until > now())
  ) THEN
    RAISE EXCEPTION 'This account is suspended and cannot comment. Contact support@querino.ai.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.refuse_comment_while_suspended() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refuse_comment_while_suspended() FROM anon;
REVOKE ALL ON FUNCTION public.refuse_comment_while_suspended() FROM authenticated;

DROP TRIGGER IF EXISTS refuse_comment_while_suspended ON public.comments;
CREATE TRIGGER refuse_comment_while_suspended
  BEFORE INSERT OR UPDATE OF content ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.refuse_comment_while_suspended();

CREATE OR REPLACE FUNCTION public.enqueue_comment_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- Only what a person wrote. The worker's own removal notice is written with
  -- the service role, which has no auth.uid().
  IF auth.uid() IS NULL OR NEW.user_id IS NULL THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.content IS NOT DISTINCT FROM OLD.content THEN
    RETURN NULL;
  END IF;
  -- A comment with replies is not deleted (they would cascade with it) but
  -- blanked to this exact text by its author (useComments.ts), which needs no
  -- paid review.
  IF NEW.content = '[This comment was deleted by its author.]' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.moderation_review_queue
    (item_type, item_id, user_id, editor_id, content_snapshot, status)
  VALUES
    ('comment', NEW.id, NEW.user_id, NEW.user_id, left(coalesce(NEW.content, ''), 5000), 'pending')
  ON CONFLICT (item_type, item_id) WHERE status = 'pending' DO UPDATE
    SET content_snapshot = EXCLUDED.content_snapshot;

  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.enqueue_comment_moderation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_comment_moderation() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_comment_moderation() FROM authenticated;

DROP TRIGGER IF EXISTS enqueue_comment_moderation ON public.comments;
CREATE TRIGGER enqueue_comment_moderation
  AFTER INSERT OR UPDATE OF content ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_comment_moderation();
