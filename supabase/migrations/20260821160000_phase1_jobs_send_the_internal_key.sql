-- Phase 1, part 1 of 2: the jobs start proving who they are, 2026-08-21.
--
-- WHY
--
-- Three edge functions exist only for these scheduled jobs to call, and the
-- thing calling them was the anon key, which ships inside every visitor's
-- browser bundle. So "internal" meant "public", and a stranger could drain the
-- GitHub sync queue using other people's stored tokens, force Menerio syncs,
-- or loop against the paid AI moderation endpoint and send us the bill. That
-- is finding H1.
--
-- ORDER, which is the whole risk in this phase
--
-- This migration ships BEFORE the functions that start requiring the header.
-- Sending a header nobody checks yet is harmless; requiring a header nobody
-- sends yet is an outage. On 2026-08-21 the nightly allowance job did exactly
-- that for one night, because the fix and the caller of the fix travelled on
-- two different rails. Same mistake, three more jobs, so: callers first.
--
-- THE SECRET
--
-- The value lives in Supabase Vault under `internal_job_secret` and is read at
-- run time. It is deliberately NOT written into this file. The anon key was in
-- a migration, which is how it ended up being treated as a credential; putting
-- a real secret in the same place would be that mistake again, one step worse.
--
-- To rotate: update the vault secret and the INTERNAL_JOB_SECRET edge function
-- secret to the same new value. These jobs pick it up on their next tick with
-- no redeploy and no migration.

BEGIN;

-- A single place to read the secret, so a rotation or a rename is one edit and
-- the three job bodies below never mention vault directly.
CREATE OR REPLACE FUNCTION public.internal_job_headers()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'Content-Type',  'application/json',
    'X-Internal-Key', COALESCE(
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_job_secret'),
      ''
    )
  )
$$;

-- Nobody but our own jobs has any business calling this: it hands back the
-- secret in a header object.
REVOKE ALL ON FUNCTION public.internal_job_headers() FROM public, anon, authenticated;

COMMENT ON FUNCTION public.internal_job_headers() IS
  'Headers for calling a machine-only edge function. Reads internal_job_secret '
  'from Vault at run time so the value never lands in a migration file.';

-- ---------------------------------------------------------------------------
-- The three jobs. cron.schedule() replaces a job of the same name in place,
-- so the schedules below are the existing ones, unchanged on purpose.
-- ---------------------------------------------------------------------------

SELECT cron.schedule(
  'process-menerio-sync-queue',
  '*/1 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/process-menerio-sync-queue',
    headers := public.internal_job_headers(),
    body    := '{}'::jsonb
  ) AS request_id;
  $job$
);

SELECT cron.schedule(
  'ai-moderate-content-queue',
  '*/2 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/ai-moderate-content',
    headers := public.internal_job_headers(),
    body    := '{}'::jsonb
  ) AS request_id;
  $job$
);

SELECT cron.schedule(
  'github-sync-worker-tick',
  '30 seconds',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/github-sync-worker',
    headers := public.internal_job_headers(),
    body    := jsonb_build_object('source', 'pg_cron', 'at', now())
  ) AS request_id;
  $job$
);

-- daily-token-allowance-reset is deliberately absent. Phase 0 moved it into
-- the database, where it calls public.provision_ai_allowance directly and
-- needs no key and no HTTP call at all. Leave it that way.

COMMIT;
