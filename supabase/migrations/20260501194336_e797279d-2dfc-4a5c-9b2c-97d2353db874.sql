-- Enable scheduling + outbound HTTP
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove any old version of the job
DO $$
BEGIN
  PERFORM cron.unschedule('github-sync-worker-tick');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule worker every 30 seconds (two ticks per minute)
SELECT cron.schedule(
  'github-sync-worker-tick',
  '30 seconds',
  $$
  SELECT net.http_post(
    url := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/github-sync-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dXdrZmZuZXF4cXNpaGxuZnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzY4MzEsImV4cCI6MjA4MDM1MjgzMX0.dpFIy0U_FO8Spj7V9jgKqjGUoakwFVCfNJ_8HuaYFTc'
    ),
    body := jsonb_build_object('source', 'pg_cron', 'at', now())
  );
  $$
);