-- Two findings of the 2026-09-23 review of the Menerio sync queue.
--
-- 1. A failed row was never tried again.
--
--    process-menerio-sync-queue said, in a comment, that a row which failed
--    "lands in failed and gets another turn". claim_menerio_sync_queue only
--    ever looked at 'pending', 'delete_pending' and stale 'processing' rows,
--    so 'failed' was the end of the road: one Menerio timeout, one database
--    hiccup, and that artifact never reached Menerio. A row abandoned in
--    'processing' by a dying tick had the opposite problem: it was re-claimed
--    every ten minutes for ever, with nothing counting.
--
--    Now every failure is counted in retry_count and pushes next_attempt_at
--    out by 1, 2, 4, 8 and 16 minutes. The claim hands a failed row back once
--    its wait is over, until it has failed five times. A stale 'processing'
--    row counts as a failure when it is re-claimed, and one that has already
--    used its five turns is marked failed instead of being re-claimed again.
--    A failed delete is 'delete_failed', so that its retry is still a delete.
--
-- 2. The sync button did nothing for people who sync by hand.
--
--    The worker skipped every row whose owner had auto_sync switched off. The
--    trigger only queues a changed artifact when auto_sync is on, so for those
--    rows the check only mattered if the setting changed in between. But the
--    bulk sync buttons (MenerioBulkSync, the Library selection) insert rows
--    themselves, and those users are exactly the ones who turned auto_sync
--    off: their rows were marked "skipped" and nothing was sent. Delete
--    markers for artifacts already in Menerio were skipped the same way.
--
--    A row now says where it came from. The column defaults to 'manual', so
--    the existing frontend inserts are right without a code change, and the
--    trigger writes 'trigger' explicitly. The worker applies the auto_sync
--    check to 'trigger' sync rows only.

ALTER TABLE public.menerio_sync_queue
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'menerio_sync_queue_source_check'
       AND conrelid = 'public.menerio_sync_queue'::regclass
  ) THEN
    ALTER TABLE public.menerio_sync_queue
      ADD CONSTRAINT menerio_sync_queue_source_check
      CHECK (source IN ('manual', 'trigger'));
  END IF;
END
$do$;

-- Failures from before today are history, not a backlog: a burst of weeks-old
-- rows is not what anyone expects after a deploy. Only the last day's failures
-- get the new retries.
UPDATE public.menerio_sync_queue
   SET retry_count = 5
 WHERE status = 'failed'
   AND retry_count = 0
   AND coalesce(processed_at, created_at) < now() - interval '1 day';

-- The return type gains `source`, which CREATE OR REPLACE cannot do, so the
-- function is dropped and created again with the same grants.
DROP FUNCTION IF EXISTS public.claim_menerio_sync_queue(integer, interval);

CREATE FUNCTION public.claim_menerio_sync_queue(
  batch_size integer DEFAULT 10,
  stale_after interval DEFAULT interval '10 minutes'
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  artifact_type text,
  artifact_id uuid,
  status text,
  created_at timestamptz,
  source text,
  retry_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH gave_up AS (
    -- A claim that died five times is not going to succeed on the sixth.
    UPDATE public.menerio_sync_queue q
       SET status = CASE
                      WHEN q.status = 'delete_processing' THEN 'delete_failed'
                      ELSE 'failed'
                    END,
           error_message = 'gave up: abandoned in processing after 5 attempts',
           processed_at = now()
     WHERE q.status IN ('processing', 'delete_processing')
       AND q.claimed_at IS NOT NULL
       AND q.claimed_at < now() - stale_after
       AND q.retry_count >= 5
    RETURNING q.id
  ),
  claimable AS (
    SELECT q.id, q.status AS was
      FROM public.menerio_sync_queue q
     WHERE q.status IN ('pending', 'delete_pending')
        OR (q.status IN ('failed', 'delete_failed')
            AND q.retry_count < 5
            AND coalesce(q.next_attempt_at, q.processed_at, q.created_at) <= now())
        OR (q.status IN ('processing', 'delete_processing')
            AND q.retry_count < 5
            AND q.claimed_at IS NOT NULL
            AND q.claimed_at < now() - stale_after)
     ORDER BY q.created_at
     LIMIT greatest(batch_size, 0)
     FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.menerio_sync_queue q
       SET status = CASE
                      WHEN c.was IN ('delete_pending', 'delete_processing', 'delete_failed')
                        THEN 'delete_processing'
                      ELSE 'processing'
                    END,
           -- A stale claim is a failed attempt nobody got to record.
           retry_count = q.retry_count
             + CASE WHEN c.was IN ('processing', 'delete_processing') THEN 1 ELSE 0 END,
           claimed_at = now()
      FROM claimable c
     WHERE q.id = c.id
    RETURNING q.id, q.user_id, q.artifact_type, q.artifact_id, c.was,
              q.created_at, q.source, q.retry_count
  )
  -- Hand the caller back the status the row was claimed FROM, normalised to
  -- 'pending' or 'delete_pending', so the worker decides sync vs delete
  -- exactly as before.
  SELECT
    claimed.id,
    claimed.user_id,
    claimed.artifact_type,
    claimed.artifact_id,
    CASE
      WHEN claimed.was IN ('delete_pending', 'delete_processing', 'delete_failed')
        THEN 'delete_pending'
      ELSE 'pending'
    END AS status,
    claimed.created_at,
    claimed.source,
    claimed.retry_count
  FROM claimed
  ORDER BY claimed.created_at;
$$;

REVOKE ALL ON FUNCTION public.claim_menerio_sync_queue(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_menerio_sync_queue(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION public.claim_menerio_sync_queue(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_menerio_sync_queue(integer, interval) TO service_role;

COMMENT ON FUNCTION public.claim_menerio_sync_queue(integer, interval) IS
  'Claims up to batch_size Menerio sync queue rows in one statement (FOR UPDATE SKIP LOCKED): pending rows, failed rows whose backoff is over (fewer than 5 failures), and stale processing rows. Returns the status each row was claimed from, normalised to pending or delete_pending. Finding M4 of 2026-08-20, retries since 2026-09-23.';

-- The worker records a failure through this, so the count, the backoff and
-- the sync-or-delete distinction change together in one statement.
CREATE OR REPLACE FUNCTION public.fail_menerio_sync_queue_row(
  p_id uuid,
  p_error text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.menerio_sync_queue q
     SET status = CASE
                    WHEN q.status IN ('delete_processing', 'delete_pending', 'delete_failed')
                      THEN 'delete_failed'
                    ELSE 'failed'
                  END,
         error_message = left(coalesce(p_error, 'Unknown error'), 1000),
         processed_at = now(),
         -- 1, 2, 4, 8, 16 minutes: the wait before the Nth retry is 2^(N-1).
         next_attempt_at = now() + interval '1 minute' * power(2, least(q.retry_count, 10)),
         retry_count = q.retry_count + 1
   WHERE q.id = p_id;
$$;

REVOKE ALL ON FUNCTION public.fail_menerio_sync_queue_row(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_menerio_sync_queue_row(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.fail_menerio_sync_queue_row(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fail_menerio_sync_queue_row(uuid, text) TO service_role;

-- queue_menerio_sync as last defined in 20260908231000 (section 23), with one
-- change: both inserts say source 'trigger'.
CREATE OR REPLACE FUNCTION public.queue_menerio_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_artifact_type text;
  v_integration record;
  v_should_queue boolean := false;
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

      INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status, source)
      VALUES (OLD.author_id, v_artifact_type, OLD.id, 'delete_pending', 'trigger');
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.author_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_active, auto_sync, sync_artifact_types
    INTO v_integration
    FROM public.menerio_integration
   WHERE user_id = NEW.author_id
   LIMIT 1;

  IF NOT FOUND
     OR v_integration.is_active IS NOT TRUE
     OR v_integration.auto_sync IS NOT TRUE
     OR NOT (v_artifact_type = ANY(v_integration.sync_artifact_types)) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_queue := true;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.title IS DISTINCT FROM NEW.title
       OR OLD.description IS DISTINCT FROM NEW.description
       OR OLD.content IS DISTINCT FROM NEW.content
       OR OLD.category IS DISTINCT FROM NEW.category
       OR OLD.tags IS DISTINCT FROM NEW.tags
    THEN
      v_should_queue := true;
    END IF;
  END IF;

  IF v_should_queue THEN
    DELETE FROM public.menerio_sync_queue
     WHERE artifact_type = v_artifact_type
       AND artifact_id = NEW.id
       AND status = 'pending';

    INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status, source)
    VALUES (NEW.author_id, v_artifact_type, NEW.id, 'pending', 'trigger');
  END IF;

  RETURN NEW;
END;
$fn$;
