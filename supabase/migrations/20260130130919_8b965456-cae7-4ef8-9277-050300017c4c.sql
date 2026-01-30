-- Simplify AI allowance schema: tokens as single source of truth
-- Credits will be calculated dynamically at display time

-- Step 1: Drop the view first (it depends on these columns)
DROP VIEW IF EXISTS v_ai_allowance_current;

-- Step 2: Remove redundant credit columns from ai_allowance_periods
ALTER TABLE ai_allowance_periods 
  DROP COLUMN IF EXISTS credits_granted,
  DROP COLUMN IF EXISTS credits_used,
  DROP COLUMN IF EXISTS milli_credits_granted,
  DROP COLUMN IF EXISTS milli_credits_used,
  DROP COLUMN IF EXISTS token_to_milli_credit_factor,
  DROP COLUMN IF EXISTS credits_unit;

-- Step 3: Remove milli_credits_charged from llm_usage_events (keep credits_charged for historical reference)
ALTER TABLE llm_usage_events
  DROP COLUMN IF EXISTS milli_credits_charged;

-- Step 4: Recreate the view with dynamic credit calculation
-- Credits are calculated as: tokens / tokens_per_credit (from ai_credit_settings)
CREATE OR REPLACE VIEW v_ai_allowance_current AS
SELECT 
  ap.id,
  ap.user_id,
  ap.period_start,
  ap.period_end,
  ap.tokens_granted,
  ap.tokens_used,
  (ap.tokens_granted - ap.tokens_used) AS remaining_tokens,
  ap.source,
  ap.metadata,
  ap.created_at,
  ap.updated_at,
  -- Dynamic credit calculation using current tokens_per_credit setting
  COALESCE(
    (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
    200
  ) AS tokens_per_credit,
  -- Calculate credits dynamically
  ROUND(ap.tokens_granted::numeric / NULLIF(COALESCE(
    (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
    200
  ), 0), 2) AS credits_granted,
  ROUND(ap.tokens_used::numeric / NULLIF(COALESCE(
    (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
    200
  ), 0), 2) AS credits_used,
  ROUND((ap.tokens_granted - ap.tokens_used)::numeric / NULLIF(COALESCE(
    (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'),
    200
  ), 0), 2) AS remaining_credits
FROM ai_allowance_periods ap
WHERE ap.period_start <= now() 
  AND ap.period_end > now();