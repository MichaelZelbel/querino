-- pg_net's response log is vacuumed every hour, so it stops growing
-- (2026-09-30 audit).
--
-- 20260911130000 fixed the Disk IO incident of 2026-09-11 by hand: it
-- truncated net._http_response once (723 MB for 1,300 live rows) and pruned
-- the pg_cron run log every day. The run log has stayed small since (13 MB,
-- one week of rows, pruned daily at noon). The response log did not, because
-- nothing was changed about why it grew:
--
--   2026-09-30, 18.5 days after the truncate: 75 MB on disk (9,517 pages) for
--   720 live rows, which is 60 percent of the 125 MB database and about 4 MB
--   more every day. All 720 were the four two-minute tickers' answers from
--   the last six hours, every one a 200.
--
-- Why it grows. pg_net deletes a response once it is older than pg_net.ttl
-- (6 hours), and Postgres prunes the deleted rows off their pages as it goes.
-- That keeps the dead-row count autovacuum watches at zero, so autovacuum
-- never starts: pg_stat_all_tables shows one autovacuum of this table in its
-- life, on 2026-08-05, and 0 dead rows and 0 inserts since the last vacuum
-- today. The space pruning frees inside a page is only offered to new rows
-- once a VACUUM has written it into the free space map, so without one every
-- insert extends the file instead. At 4 MB a day the 2026-09-11 incident
-- comes back by spring, on the same Micro instance with the same 256 MB of
-- cache. (The same mechanism, measured the same way, is described in
-- https://github.com/alexsave/foolish/pull/170.)
--
-- What this does:
--   1. Empties the table once more. It only ever holds the last six hours of
--      scheduler answers, and nothing in this repository reads it.
--   2. Schedules a plain VACUUM of it every hour. The job's command must stay
--      ONE statement: pg_cron runs a command of several statements as one
--      transaction, and VACUUM refuses to run inside a transaction. It runs
--      as postgres, which holds MAINTAIN on the table (granted to PUBLIC by
--      pg_net's owner, supabase_admin); without that privilege VACUUM would
--      skip the table with a warning and the run log would still say
--      succeeded. An hour between vacuums keeps about seven hours of rows,
--      a megabyte or two, and adds 24 rows a day to the run log. Minute 17
--      stays clear of the tickers, which fire on even minutes.
--   3. Gives the nightly model sync the same 30 second answer window the four
--      tickers got in 20260923140300. It was the one scheduled call left on
--      pg_net's 5 second default, so a slow night at OpenRouter would be
--      logged as a timeout while the function carried on.
--
-- cron.schedule() replaces a job of the same name in place, and truncating a
-- six-hour log again is harmless, so running this again changes nothing.

-- 1.
TRUNCATE net._http_response;

-- 2.
SELECT cron.schedule(
  'vacuum-pg-net-responses',
  '17 * * * *',
  $$VACUUM net._http_response$$
);

-- 3. The live command (cron.job, read on 2026-09-30) with
--    timeout_milliseconds added and nothing else changed.
SELECT cron.schedule(
  'sync-llm-models-nightly',
  '20 4 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/sync-llm-models',
    headers := public.internal_job_headers(),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $job$
);
