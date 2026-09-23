-- The two sync queues are pruned once a day (2026-09-23 review).
--
-- github_sync_queue was never pruned: every finished row stayed for good,
-- 'done' and 'skipped' alike, and until 20260923120100 every artifact write
-- by anyone added one. On a Micro instance whose Disk IO budget was already
-- burned once by unpruned bookkeeping (20260911130000), a table that only
-- grows is the same mistake waiting to happen again.
--
-- menerio_sync_queue is pruned by its worker, which deletes completed rows
-- older than a day at the end of each tick, but only on a tick that found
-- something to claim. This is the backstop that runs whether or not anything
-- was synced.
--
-- A week is kept of both, so a sync question can still be answered from the
-- rows. Failed rows stay: they are the ones somebody may need to read.
--
-- cron.schedule() replaces a job of the same name in place, so running this
-- again changes nothing.

SELECT cron.schedule(
  'prune-sync-queues',
  '15 12 * * *',
  $$
    DELETE FROM public.github_sync_queue
     WHERE status IN ('done', 'skipped')
       AND updated_at < now() - interval '7 days';
    DELETE FROM public.menerio_sync_queue
     WHERE status = 'completed'
       AND coalesce(processed_at, created_at) < now() - interval '7 days';
  $$
);
