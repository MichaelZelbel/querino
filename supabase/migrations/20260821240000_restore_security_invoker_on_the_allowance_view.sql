-- Repairing a hole this audit made itself, an hour after making it.
--
-- v_ai_allowance_current was created in January WITH (security_invoker = on),
-- so it read ai_allowance_periods as the caller and row-level security decided
-- what came back. The Phase 2 migration (20260821200000) rewrote it with a
-- plain CREATE OR REPLACE VIEW ... AS to add DISTINCT ON, and CREATE OR REPLACE
-- VIEW resets any option the new statement does not name. The view went back to
-- running as its owner, which is postgres, which is not subject to RLS.
--
-- What that meant while it lasted: a single GET to
-- /rest/v1/v_ai_allowance_current with the public anon key returned every
-- user's id, token grant and remaining balance. 24 of them. The anon key is in
-- the browser bundle, so that is "anyone".
--
-- Measured, not assumed: an anonymous caller got 24 rows before this migration
-- and 0 after. Supabase's own advisor called it too, as the ERROR-level lint
-- security_definer_view.
--
-- Two things follow from it, both done alongside this file:
--   * tests/security/15 asks an anonymous caller what it can see, so the leak
--     cannot come back silently.
--   * scripts/check-migrations.mjs now fails any migration that creates a view
--     in public without saying security_invoker one way or the other, because
--     the default is the dangerous one and the mistake is invisible in a diff.

CREATE OR REPLACE VIEW public.v_ai_allowance_current
WITH (security_invoker = on)
AS
SELECT DISTINCT ON (ap.user_id)
  ap.id,
  ap.user_id,
  ap.period_start,
  ap.period_end,
  ap.tokens_granted,
  ap.tokens_used,
  ap.tokens_granted - ap.tokens_used AS remaining_tokens,
  ap.source,
  ap.metadata,
  ap.created_at,
  ap.updated_at,
  public.tokens_per_credit() AS tokens_per_credit,
  round(ap.tokens_granted::numeric / NULLIF(public.tokens_per_credit(), 0)::numeric, 2) AS credits_granted,
  round(ap.tokens_used::numeric / NULLIF(public.tokens_per_credit(), 0)::numeric, 2) AS credits_used,
  round((ap.tokens_granted - ap.tokens_used)::numeric / NULLIF(public.tokens_per_credit(), 0)::numeric, 2) AS remaining_credits
FROM public.ai_allowance_periods ap
WHERE ap.period_start <= now()
  AND ap.period_end > now()
ORDER BY ap.user_id, ap.period_end DESC;

COMMENT ON VIEW public.v_ai_allowance_current IS
  'The current allowance period, one row per user, read as the caller. security_invoker is the whole security model here: without it this view hands every user''s balance to anyone holding the anon key. One row per user because _shared/llm.ts reads it with maybeSingle(), which errors on a second row. Findings M5 and the Phase 2 regression.';

DO $verify$
DECLARE
  v_invoker text;
BEGIN
  SELECT opt INTO v_invoker
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL unnest(coalesce(c.reloptions, '{}')) AS opt
   WHERE n.nspname = 'public' AND c.relname = 'v_ai_allowance_current'
     AND opt LIKE 'security_invoker=%';

  IF v_invoker IS NULL THEN
    RAISE EXCEPTION 'v_ai_allowance_current still has no security_invoker option set';
  END IF;
END $verify$;
