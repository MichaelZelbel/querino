-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule daily token allowance reset at 00:05 UTC (5 minutes after midnight)
SELECT cron.schedule(
  'daily-token-allowance-reset',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/ensure-token-allowance',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"batch_init": true}'::jsonb
  );
  $$
);