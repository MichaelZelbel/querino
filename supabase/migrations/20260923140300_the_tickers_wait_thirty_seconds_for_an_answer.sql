-- The four two-minute tickers wait 30 seconds for an answer (2026-09-23).
--
-- Every ticker calls its edge function with net.http_post and no
-- timeout_milliseconds, so pg_net gave up after its default of 5 seconds.
-- An edge function's cold start plus a first query can take longer than
-- that, and the 2026-09-23 review found 6 of about 720 ticks recorded as
-- timed out.
-- The function itself carries on either way, but the run log then says the
-- tick failed when it did not, which is the log a failure is looked for in.
--
-- Each command below is the live one (cron.job, read on 2026-09-23) with
-- timeout_milliseconds := 30000 added and nothing else changed: same name,
-- same schedule, same URL, same body. The key comes from
-- public.internal_job_headers(), which reads it from Vault, so no secret is
-- written here. cron.schedule() replaces a job of the same name in place, so
-- running this again changes nothing.

SELECT cron.schedule(
  'github-sync-worker-tick',
  '*/2 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/github-sync-worker',
    headers := public.internal_job_headers(),
    body    := jsonb_build_object('source', 'pg_cron', 'at', now()),
    timeout_milliseconds := 30000
  ) AS request_id;
  $job$
);

SELECT cron.schedule(
  'process-menerio-sync-queue',
  '*/2 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/process-menerio-sync-queue',
    headers := public.internal_job_headers(),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
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
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $job$
);

SELECT cron.schedule(
  'backfill-embeddings-tick',
  '*/2 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/backfill-embeddings',
    headers := public.internal_job_headers(),
    body    := jsonb_build_object('maxItems', 100),
    timeout_milliseconds := 30000
  ) AS request_id;
  $job$
);
