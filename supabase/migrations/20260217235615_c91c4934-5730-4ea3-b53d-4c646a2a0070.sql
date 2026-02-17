-- Drop and recreate the view WITHOUT security_definer
-- This makes it use SECURITY INVOKER (default), so RLS on underlying tables applies to the querying user
DROP VIEW IF EXISTS public.v_ai_allowance_current;

CREATE VIEW public.v_ai_allowance_current
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  period_start,
  period_end,
  tokens_granted,
  tokens_used,
  (tokens_granted - tokens_used) AS remaining_tokens,
  source,
  metadata,
  created_at,
  updated_at,
  COALESCE(
    (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
    200
  ) AS tokens_per_credit,
  round(
    tokens_granted::numeric / NULLIF(COALESCE(
      (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
      200
    ), 0)::numeric,
    2
  ) AS credits_granted,
  round(
    tokens_used::numeric / NULLIF(COALESCE(
      (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
      200
    ), 0)::numeric,
    2
  ) AS credits_used,
  round(
    (tokens_granted - tokens_used)::numeric / NULLIF(COALESCE(
      (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
      200
    ), 0)::numeric,
    2
  ) AS remaining_credits
FROM ai_allowance_periods ap
WHERE period_start <= now() AND period_end > now();