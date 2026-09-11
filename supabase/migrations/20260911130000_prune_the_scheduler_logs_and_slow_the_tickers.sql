-- On 2026-09-11 Supabase warned that Querino was depleting its Disk IO budget.
-- The product data was 15 MB. The database was 1.3 GB, and all of the rest was
-- two bookkeeping tables nobody had ever pruned:
--
--   cron.job_run_details   578 MB, 750,420 rows since 2026-01-31. pg_cron writes
--                          one row plus four updates per job run and never
--                          deletes any of it. Supabase's docs say so out loud.
--   net._http_response     723 MB for 1,300 live rows. pg_net deletes rows older
--                          than pg_net.ttl (6 hours) but the file never shrinks,
--                          because opportunistic pruning removes the tuples and
--                          no vacuum ever hands the pages back. Vacuumed once,
--                          on 2026-08-05.
--
-- Of every disk read this database had done since November, 99 percent went to
-- those two tables: 5.4 GB from the run log and 3.6 GB from the response log,
-- against almost nothing for prompts, skills, workflows and kits. The machine is
-- a Micro (1 GB RAM, 256 MB Postgres cache), so any query that touches either
-- table reads the whole thing from disk. The health checks run during the
-- 2026-09-08/09 audit did exactly that, several times, and burned the budget.
--
-- The feed was four scheduled edge-function calls, 5,760 a day, nearly all of
-- them finding nothing to do (average run under 0.03 s): the GitHub sync every
-- 30 seconds, the Menerio sync every minute, moderation and embeddings every
-- two minutes.
--
-- What was done on 2026-09-11 through the management API, in this order:
--   1. DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'
--      (710,138 rows), then VACUUM FULL cron.job_run_details.
--   2. TRUNCATE net._http_response (it only ever matters for the last 6 hours).
--   3. The daily cleanup job below.
--   4. The two fastest tickers slowed to every two minutes.
-- Result: 1,335 MB -> 49 MB.
--
-- This file records steps 3 and 4 so a fresh project gets the same shape. Both
-- statements are safe to run again: cron.schedule() replaces a job of the same
-- name in place, and alter_job on an already-slowed job changes nothing.

-- 3. Prune the scheduler's run log every day at noon UTC, keeping one week.
SELECT cron.schedule(
  'delete-job-run-details',
  '0 12 * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'$$
);

-- 4. A sync that lands two minutes later costs nobody anything; a tick every
--    30 seconds cost 2,880 rows a day in each of two tables.
SELECT cron.alter_job(jobid, schedule := '*/2 * * * *')
  FROM cron.job
 WHERE jobname IN ('github-sync-worker-tick', 'process-menerio-sync-queue');
