-- The GitHub sync queue waits before it retries (2026-09-23 review).
--
-- github-sync-worker put a failed row straight back to 'pending', and the
-- next tick two minutes later claimed it again. Three attempts in four
-- minutes: a GitHub outage, a rate limit or a Vault hiccup of a few minutes
-- used up every attempt, and the row ended 'failed' for something that would
-- have worked a little later.
--
-- The worker now writes next_attempt_at = now() + 2^attempts minutes when an
-- attempt fails (2 minutes after the first, 4 after the second), and the
-- claim skips a pending or failed row until that time has passed. A row that
-- never failed has next_attempt_at NULL and is claimed as before.
--
-- claim_github_sync_queue below is the live definition (20260923120100,
-- checked with pg_get_functiondef on 2026-09-23) with the one condition added
-- to its first branch. Stale 'processing' rows are unaffected.
--
-- Apply this before deploying the github-sync-worker that writes the column;
-- the old worker keeps working against it, since the column is nullable.

ALTER TABLE public.github_sync_queue
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;

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
     WHERE (q.status IN ('pending', 'failed')
            AND q.attempts < max_attempts
            AND (q.next_attempt_at IS NULL OR q.next_attempt_at <= now()))
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
