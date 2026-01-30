-- Remove old job and recreate with proper auth
SELECT cron.unschedule(1);

-- Schedule daily token allowance reset at 00:05 UTC
-- Uses anon key since the edge function handles batch_init internally without JWT validation
SELECT cron.schedule(
  'daily-token-allowance-reset',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/ensure-token-allowance',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dXdrZmZuZXF4cXNpaGxuZnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODc4NTEsImV4cCI6MjA1MDU2Mzg1MX0.mHhSgjr8OcYB12l8xy8mJPBLiUke9mf3pPI1FGOY8Vw"}'::jsonb,
    body := '{"batch_init": true}'::jsonb
  );
  $$
);