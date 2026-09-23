-- A signed-in user could queue a Menerio sync row that jumped every queue
-- (2026-09-23 review, finding MEDIUM).
--
-- The INSERT policy on menerio_sync_queue checked who the row was for and
-- that they owned the artifact, and nothing else. Every other column was the
-- caller's to choose through PostgREST, so a row could arrive with created_at
-- 1970, status 'failed' and retry_count -1000000. claim_menerio_sync_queue
-- orders by created_at and hands a failed row back while retry_count < 5, so
-- that one row was claimed first on every tick, failed, and was claimed again:
-- a few of them and nobody else's sync ever reached the front.
--
-- Three locks, each enough on its own for its part:
--
--   1. CHECKs on the table: retry_count is never negative, and status is one
--      of the seven values the trigger and the worker actually write
--      (queue_menerio_sync: pending, delete_pending; claim_menerio_sync_queue:
--      processing, delete_processing, failed, delete_failed; the worker:
--      completed, and pending/delete_pending when a tick hands back rows it
--      never started). On 2026-09-23 every live row was 'completed' with
--      retry_count 0.
--
--   2. The INSERT policy for authenticated now also requires a row that looks
--      like a fresh request: pending or delete_pending, retry_count 0, never
--      claimed, never processed, no backoff, no error text, source 'manual'.
--      The two frontend inserts (MenerioBulkSync.tsx and Library.tsx) set
--      user_id, artifact_type, artifact_id and status 'pending' only, and the
--      defaults supply the rest, so both still pass. The trigger inserts as
--      its SECURITY DEFINER owner and is not subject to the policy.
--
--   3. A BEFORE INSERT trigger stamps created_at with now(). Nothing sets it
--      legitimately: the frontend and queue_menerio_sync leave it to the
--      default, and so does the security suite's service-role insert. It is
--      therefore stamped for every caller, which also keeps a future service
--      path from reordering the queue by accident.
--
-- authenticated has no UPDATE or DELETE policy on this table (checked live on
-- 2026-09-23: INSERT and two SELECT policies only), so a queued row cannot be
-- edited into the same shape afterwards. anon has no policy at all.

-- ---------------------------------------------------------------------------
-- 1.
-- ---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'menerio_sync_queue_retry_count_check'
       AND conrelid = 'public.menerio_sync_queue'::regclass
  ) THEN
    ALTER TABLE public.menerio_sync_queue
      ADD CONSTRAINT menerio_sync_queue_retry_count_check
      CHECK (retry_count >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'menerio_sync_queue_status_check'
       AND conrelid = 'public.menerio_sync_queue'::regclass
  ) THEN
    ALTER TABLE public.menerio_sync_queue
      ADD CONSTRAINT menerio_sync_queue_status_check
      CHECK (status IN (
        'pending', 'processing', 'completed', 'failed',
        'delete_pending', 'delete_processing', 'delete_failed'
      ));
  END IF;
END
$do$;

-- ---------------------------------------------------------------------------
-- 2. The live policy (20260908120300) with the fresh-request conditions added.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own sync queue entries" ON public.menerio_sync_queue;

CREATE POLICY "Users can insert own sync queue entries"
  ON public.menerio_sync_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_item_owner(artifact_type, artifact_id, auth.uid())
    AND status IN ('pending', 'delete_pending')
    AND retry_count = 0
    AND next_attempt_at IS NULL
    AND claimed_at IS NULL
    AND processed_at IS NULL
    AND error_message IS NULL
    AND source = 'manual'
  );

-- ---------------------------------------------------------------------------
-- 3.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.menerio_sync_queue_stamp_created_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.menerio_sync_queue_stamp_created_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.menerio_sync_queue_stamp_created_at() FROM anon;
REVOKE ALL ON FUNCTION public.menerio_sync_queue_stamp_created_at() FROM authenticated;

DROP TRIGGER IF EXISTS menerio_sync_queue_stamp_created_at ON public.menerio_sync_queue;

CREATE TRIGGER menerio_sync_queue_stamp_created_at
  BEFORE INSERT ON public.menerio_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.menerio_sync_queue_stamp_created_at();
