-- Findings 7 and 8 of the 2026-09-08 audit, the same shape as M4 of the
-- August one (claim_menerio_sync_queue).
--
-- ai-moderate-content selected pending rows and only wrote a status back after
-- the AI call; github-sync-worker selected pending rows and then marked each
-- one processing. With a cron tick every two minutes and every thirty seconds
-- respectively, and an admin button that fires the moderation job by hand, two
-- runs could pick up the same row: two strikes, two emails, two commits. A
-- row whose run died mid-way stayed 'processing' for ever, because nothing
-- ever selected that status again.
--
-- Each queue now gets a claimed_at column and one function that claims a batch
-- in a single statement with FOR UPDATE SKIP LOCKED, and reclaims rows whose
-- claim is older than stale_after. Strikes are counted in SQL rather than
-- read-modify-write in the worker.

ALTER TABLE public.moderation_review_queue
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE public.github_sync_queue
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE OR REPLACE FUNCTION public.claim_moderation_review_queue(
  batch_size integer DEFAULT 5,
  stale_after interval DEFAULT interval '10 minutes'
)
RETURNS TABLE (
  id uuid,
  item_type text,
  item_id uuid,
  user_id uuid,
  content_snapshot text,
  retry_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH claimable AS (
    SELECT q.id
      FROM public.moderation_review_queue q
     WHERE q.status = 'pending'
        OR (q.status = 'processing'
            AND q.claimed_at IS NOT NULL
            AND q.claimed_at < now() - stale_after)
     ORDER BY q.created_at
     LIMIT greatest(batch_size, 0)
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.moderation_review_queue q
     SET status = 'processing',
         claimed_at = now()
    FROM claimable c
   WHERE q.id = c.id
  RETURNING q.id, q.item_type, q.item_id, q.user_id, q.content_snapshot, q.retry_count;
$$;

REVOKE ALL ON FUNCTION public.claim_moderation_review_queue(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_moderation_review_queue(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION public.claim_moderation_review_queue(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_moderation_review_queue(integer, interval) TO service_role;

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
  WITH claimable AS (
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

CREATE OR REPLACE FUNCTION public.increment_user_strike(
  p_user_id uuid,
  p_threshold integer DEFAULT 5
)
RETURNS TABLE (strike_count integer, suspended boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.user_suspensions AS s (user_id, strike_count, suspended)
  VALUES (p_user_id, 1, 1 >= p_threshold)
  ON CONFLICT (user_id) DO UPDATE
     SET strike_count = s.strike_count + 1,
         suspended = s.suspended OR (s.strike_count + 1) >= p_threshold,
         suspended_at = CASE
           WHEN NOT s.suspended AND (s.strike_count + 1) >= p_threshold THEN now()
           ELSE s.suspended_at
         END,
         suspension_reason = CASE
           WHEN NOT s.suspended AND (s.strike_count + 1) >= p_threshold
             THEN 'Auto-suspended after ' || (s.strike_count + 1) || ' content violations (AI moderation)'
           ELSE s.suspension_reason
         END,
         updated_at = now()
  RETURNING s.strike_count, s.suspended;
$$;

REVOKE ALL ON FUNCTION public.increment_user_strike(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_user_strike(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.increment_user_strike(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_strike(uuid, integer) TO service_role;
