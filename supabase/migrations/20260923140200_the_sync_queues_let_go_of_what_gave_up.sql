-- The daily prune also lets go of rows that gave up (2026-09-23 review).
--
-- 20260923120200 kept every failed row on purpose: they are the ones somebody
-- may need to read. But a row that has given up is never claimed again, so
-- nothing else ever removes it, and the queues would grow by every failure for
-- good. A month is long enough for anyone to read why a sync failed.
--
-- What counts as given up:
--   github_sync_queue   'failed'. The worker writes it only on the last
--                       attempt, and the claim marks an abandoned last attempt
--                       'failed' too.
--   menerio_sync_queue  'failed' or 'delete_failed' with retry_count >= 5.
--                       Below five the claim still hands the row back after
--                       its backoff (20260923120000), so it is not finished.
--
-- The job is unscheduled and scheduled again under the same name and at the
-- same time; only its command changes. Running this again changes nothing.

SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname = 'prune-sync-queues';

SELECT cron.schedule(
  'prune-sync-queues',
  '15 12 * * *',
  $$
    DELETE FROM public.github_sync_queue
     WHERE status IN ('done', 'skipped')
       AND updated_at < now() - interval '7 days';
    DELETE FROM public.github_sync_queue
     WHERE status = 'failed'
       AND updated_at < now() - interval '30 days';
    DELETE FROM public.menerio_sync_queue
     WHERE status = 'completed'
       AND coalesce(processed_at, created_at) < now() - interval '7 days';
    DELETE FROM public.menerio_sync_queue
     WHERE status IN ('failed', 'delete_failed')
       AND retry_count >= 5
       AND coalesce(processed_at, created_at) < now() - interval '30 days';
  $$
);
