-- Finding M4: overlapping cron ticks double-send Menerio syncs.
--
-- process-menerio-sync-queue used to SELECT ten pending rows and then, in a
-- second statement, UPDATE them to 'processing'. The job runs every minute. If
-- one tick was slow, the next tick selected the same rows in the gap between
-- those two statements and sent the same artifact to the user's Menerio host
-- twice.
--
-- The fix is to claim rows in one statement, so the row lock and the status
-- change happen together and a second tick simply skips them.
--
-- Two supporting changes, both needed for the claim to be safe rather than
-- merely atomic:
--
--   claimed_at        A row that is claimed and then lost (the function times
--                     out, the isolate is recycled) used to sit in 'processing'
--                     for ever, because the old SELECT only looked at
--                     'pending'. Atomic claiming would have made that worse, so
--                     a claim now carries a timestamp and a stale one is
--                     re-claimable.
--
--   delete_processing A delete and a sync are different work, and the old code
--                     told them apart by reading item.status from the row it
--                     had selected BEFORE the update. Claiming returns the row
--                     after the update, so the distinction has to survive in
--                     the status itself.

ALTER TABLE public.menerio_sync_queue
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Oldest-first over the claimable rows is the whole access pattern.
CREATE INDEX IF NOT EXISTS menerio_sync_queue_claimable_idx
  ON public.menerio_sync_queue (status, created_at);

-- Anything left 'processing' by a previous deploy has no claimed_at and would
-- otherwise never become stale. Treat those as claimed at the moment of this
-- migration, so the first tick after the stale window picks them up.
UPDATE public.menerio_sync_queue
   SET claimed_at = now()
 WHERE status IN ('processing', 'delete_processing')
   AND claimed_at IS NULL;

CREATE OR REPLACE FUNCTION public.claim_menerio_sync_queue(
  batch_size integer DEFAULT 10,
  stale_after interval DEFAULT interval '10 minutes'
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  artifact_type text,
  artifact_id uuid,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH claimable AS (
    SELECT q.id, q.status AS was
      FROM public.menerio_sync_queue q
     WHERE q.status IN ('pending', 'delete_pending')
        OR (q.status IN ('processing', 'delete_processing')
            AND q.claimed_at IS NOT NULL
            AND q.claimed_at < now() - stale_after)
     ORDER BY q.created_at
     LIMIT greatest(batch_size, 0)
     FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.menerio_sync_queue q
       SET status = CASE
                      WHEN c.was IN ('delete_pending', 'delete_processing')
                        THEN 'delete_processing'
                      ELSE 'processing'
                    END,
           claimed_at = now()
      FROM claimable c
     WHERE q.id = c.id
    RETURNING q.id, q.user_id, q.artifact_type, q.artifact_id, c.was, q.created_at
  )
  -- Hand the caller back the status the row was claimed FROM, normalised, so
  -- the worker keeps deciding on 'pending' vs 'delete_pending' exactly as
  -- before and does not need to learn the two new processing states.
  SELECT
    claimed.id,
    claimed.user_id,
    claimed.artifact_type,
    claimed.artifact_id,
    CASE
      WHEN claimed.was IN ('delete_pending', 'delete_processing')
        THEN 'delete_pending'
      ELSE 'pending'
    END AS status,
    claimed.created_at
  FROM claimed
  ORDER BY claimed.created_at;
$$;

-- Only the service role runs the worker. No browser session should be able to
-- claim another user's queue rows, and this function is SECURITY DEFINER.
REVOKE ALL ON FUNCTION public.claim_menerio_sync_queue(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_menerio_sync_queue(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION public.claim_menerio_sync_queue(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_menerio_sync_queue(integer, interval) TO service_role;

COMMENT ON FUNCTION public.claim_menerio_sync_queue(integer, interval) IS
  'Claims up to batch_size Menerio sync queue rows in one statement (FOR UPDATE SKIP LOCKED), so overlapping cron ticks cannot send the same artifact twice. Returns the status each row was claimed from. Finding M4 of the 2026-08-20 audit.';
