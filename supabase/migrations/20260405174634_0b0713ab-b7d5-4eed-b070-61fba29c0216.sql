
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the AI moderation queue processor to run every 2 minutes
SELECT cron.schedule(
  'ai-moderate-content-queue',
  '*/2 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/ai-moderate-content',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dXdrZmZuZXF4cXNpaGxuZnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzY4MzEsImV4cCI6MjA4MDM1MjgzMX0.dpFIy0U_FO8Spj7V9jgKqjGUoakwFVCfNJ_8HuaYFTc"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
