-- Who actually spends the AI budget, grouped so the panel does not have to.
--
-- On 2026-08-23 the tiering question (cheaper models for free users) was decided
-- against, because the ledger said free callers had cost half a cent in seven
-- months. That decision has a threshold attached to it, and a threshold nobody
-- can see is a decision nobody revisits. This function is how the admin panel
-- re-asks the question without anyone hand-writing SQL.
--
-- Three things here are deliberate:
--
--   1. call_site coalesces `feature` with `workflow_name`. 146 of the first 300
--      ledger rows have a NULL feature and carry the workflow name instead, from
--      the older n8n-era logging. Grouping on `feature` alone loses half the
--      history without saying so.
--
--   2. One role per user, highest privilege first. user_roles allows a user to
--      hold several, and a plain LEFT JOIN would then count that user's calls
--      once per role. Admin outranks premium so the operator testing his own app
--      is never counted as a paying customer.
--
--   3. SECURITY DEFINER, because llm_usage_events has RLS restricting every
--      reader to their own rows, which is right for users and useless for an
--      aggregate. Execute is revoked from anon and authenticated, so the only
--      caller is the service role inside admin-llm-config, which checks for an
--      admin before it gets here.

CREATE OR REPLACE FUNCTION public.admin_llm_usage_summary(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
  call_site         TEXT,
  caller_role       TEXT,
  is_machine        BOOLEAN,
  config_source     TEXT,
  calls             BIGINT,
  prompt_tokens     BIGINT,
  completion_tokens BIGINT,
  credits           NUMERIC,
  users             BIGINT,
  last_call_at      TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH one_role_per_user AS (
    SELECT
      ur.user_id,
      (ARRAY_AGG(ur.role::TEXT ORDER BY CASE ur.role::TEXT
        WHEN 'admin'         THEN 1
        WHEN 'premium'       THEN 2
        WHEN 'premium_gift'  THEN 3
        ELSE 4
      END))[1] AS role
    FROM public.user_roles ur
    GROUP BY ur.user_id
  )
  SELECT
    COALESCE(e.feature, e.workflow_name, '(unnamed)')  AS call_site,
    r.role                                             AS caller_role,
    (e.user_id IS NULL)                                AS is_machine,
    e.metadata->>'config_source'                       AS config_source,
    COUNT(*)::BIGINT                                   AS calls,
    COALESCE(SUM(e.prompt_tokens), 0)::BIGINT          AS prompt_tokens,
    COALESCE(SUM(e.completion_tokens), 0)::BIGINT      AS completion_tokens,
    COALESCE(SUM(e.credits_charged), 0)::NUMERIC       AS credits,
    COUNT(DISTINCT e.user_id)::BIGINT                  AS users,
    MAX(e.created_at)                                  AS last_call_at
  FROM public.llm_usage_events e
  LEFT JOIN one_role_per_user r ON r.user_id = e.user_id
  WHERE p_since IS NULL OR e.created_at >= p_since
  GROUP BY 1, 2, 3, 4
$$;

REVOKE ALL ON FUNCTION public.admin_llm_usage_summary(TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_llm_usage_summary(TIMESTAMPTZ) FROM anon;
REVOKE ALL ON FUNCTION public.admin_llm_usage_summary(TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_llm_usage_summary(TIMESTAMPTZ) TO service_role;

COMMENT ON FUNCTION public.admin_llm_usage_summary(TIMESTAMPTZ) IS
  'AI usage grouped by call site, caller role and config source. Service role only; '
  'admin-llm-config fronts it. Answers whether free callers cost enough to justify tiering.';
