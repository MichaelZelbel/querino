-- Phase 2 of the 2026-08-20 audit: delete the second source of truth for
-- "is this user premium", and the second and third copy of the allowance logic.
--
-- Findings closed here:
--
--   M1  profiles.plan_type and user_roles could disagree about who is premium,
--       and the credit path read the wrong one. It now reads is_premium_user(),
--       which reads user_roles, so the Phase 0 trigger on profiles.plan_type
--       stops being the only thing between a free account and paid credits.
--
--   M5  v_ai_allowance_current returned every active period, and _shared/llm.ts
--       reads it with .maybeSingle(), which ERRORS on a second row. Two
--       overlapping periods therefore broke AI for that account permanently.
--       The view now returns one row per user, and overlapping periods can no
--       longer be created at all.
--
--   M6  tokens_per_credit had a fallback of 2000 in record_llm_usage and 200
--       in four other places, so a missing settings row would have granted and
--       charged on scales ten times apart. There is now one function, and it
--       raises rather than guessing. (The live value is 2000, so the four
--       places that said 200 were the wrong ones.)
--
--   S4  The same allowance logic existed three times: _shared/allowance.ts,
--       ensure-token-allowance/index.ts, and provision_ai_allowance in SQL.
--       They had already drifted: only the two TypeScript copies carried unused
--       credit over from the previous month. This function is now the only
--       implementation, and it keeps the rollover, because that is the
--       behaviour users have actually been getting from the on-demand path.
--
-- Nothing here changes a signature a caller already uses. provision_ai_allowance
-- keeps taking one uuid and returning void, which is what the nightly cron job
-- and the on_profile_created_allowance trigger call, so the database side can
-- ship before the functions that will use the richer form.

-- ---------------------------------------------------------------------------
-- One conversion rate, defined once, that fails loudly
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tokens_per_credit()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_value integer;
BEGIN
  SELECT value_int INTO v_value
    FROM public.ai_credit_settings
   WHERE key = 'tokens_per_credit';

  IF v_value IS NULL OR v_value <= 0 THEN
    RAISE EXCEPTION
      'ai_credit_settings.tokens_per_credit is missing or not positive. Grants and charges cannot be computed on a guess.'
      USING ERRCODE = 'data_exception';
  END IF;

  RETURN v_value;
END;
$$;

COMMENT ON FUNCTION public.tokens_per_credit() IS
  'The one definition of how many tokens make a credit. Raises rather than falling back, because the two fallbacks it replaces were ten times apart. Finding M6.';

-- The setting has to exist for anything above to work, so stop it being NULL.
ALTER TABLE public.ai_credit_settings
  ALTER COLUMN value_int SET NOT NULL;

-- ---------------------------------------------------------------------------
-- No two allowance periods may overlap for one user
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.ai_allowance_periods
  DROP CONSTRAINT IF EXISTS ai_allowance_periods_period_order;

ALTER TABLE public.ai_allowance_periods
  ADD CONSTRAINT ai_allowance_periods_period_order
  CHECK (period_end > period_start);

ALTER TABLE public.ai_allowance_periods
  DROP CONSTRAINT IF EXISTS ai_allowance_periods_no_overlap;

ALTER TABLE public.ai_allowance_periods
  ADD CONSTRAINT ai_allowance_periods_no_overlap
  EXCLUDE USING gist (
    user_id WITH =,
    tstzrange(period_start, period_end, '[)') WITH &&
  );

COMMENT ON CONSTRAINT ai_allowance_periods_no_overlap ON public.ai_allowance_periods IS
  'One active allowance period per user at a time. Two overlapping periods used to make assertCredits fail closed for ever, because it reads the view with maybeSingle(). Finding M5.';

-- ---------------------------------------------------------------------------
-- The one allowance implementation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ensure_ai_allowance(
  _user_id        uuid,
  _force_tokens   bigint      DEFAULT NULL,
  _period_start   timestamptz DEFAULT NULL,
  _period_end     timestamptz DEFAULT NULL,
  _source         text        DEFAULT NULL,
  _skip_rollover  boolean     DEFAULT false,
  _created_by     text        DEFAULT 'ensure_ai_allowance'
)
RETURNS TABLE (
  created        boolean,
  id             uuid,
  user_id        uuid,
  period_start   timestamptz,
  period_end     timestamptz,
  tokens_granted bigint,
  tokens_used    bigint,
  source         text,
  metadata       jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row       public.ai_allowance_periods;
  v_prev      public.ai_allowance_periods;
  v_start     timestamptz;
  v_end       timestamptz;
  v_tpc       integer;
  v_premium   boolean;
  v_credits   integer;
  v_base      bigint;
  v_rollover  bigint := 0;
  v_source    text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'ensure_ai_allowance needs a user id' USING ERRCODE = 'null_value_not_allowed';
  END IF;

  -- An active period already exists: hand it back untouched. Ordering makes
  -- this deterministic even for rows that predate the overlap constraint.
  SELECT * INTO v_row
    FROM public.ai_allowance_periods a
   WHERE a.user_id = _user_id
     AND a.period_start <= now()
     AND a.period_end   >  now()
   ORDER BY a.period_end DESC
   LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT false, v_row.id, v_row.user_id, v_row.period_start,
                        v_row.period_end, v_row.tokens_granted, v_row.tokens_used,
                        v_row.source, v_row.metadata;
    RETURN;
  END IF;

  -- The calendar month in UTC. The database runs in UTC, and this matches the
  -- Date.UTC() arithmetic the TypeScript copies used, so a period created by
  -- either implementation has identical boundaries.
  v_start := COALESCE(_period_start, date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
  v_end   := COALESCE(_period_end,   (date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month') AT TIME ZONE 'UTC');

  v_tpc := public.tokens_per_credit();

  -- user_roles is the authoritative source, through the same function is_admin
  -- and the rest of the app already use. profiles.plan_type is no longer read
  -- by anything that decides money (finding M1).
  v_premium := public.is_premium_user(_user_id);

  SELECT value_int INTO v_credits
    FROM public.ai_credit_settings
   WHERE key = CASE WHEN v_premium THEN 'credits_premium_per_month' ELSE 'credits_free_per_month' END;

  -- These two have a documented default because a missing row should not stop
  -- a user being provisioned; the conversion rate above is the one that must
  -- never be guessed. Both defaults match the live settings rows.
  v_credits := COALESCE(v_credits, CASE WHEN v_premium THEN 1500 ELSE 500 END);

  v_base := COALESCE(_force_tokens, v_credits::bigint * v_tpc);
  IF v_base < 0 THEN
    RAISE EXCEPTION 'A negative allowance cannot be granted' USING ERRCODE = 'check_violation';
  END IF;

  v_source := COALESCE(_source, CASE WHEN v_premium THEN 'subscription' ELSE 'free_tier' END);

  -- Unused tokens carry over, capped at one month's worth. Only the TypeScript
  -- copies did this, so which path provisioned you decided whether you kept
  -- last month's leftovers. It is kept because it is the behaviour the
  -- on-demand path has been giving people.
  IF NOT _skip_rollover THEN
    SELECT * INTO v_prev
      FROM public.ai_allowance_periods a
     WHERE a.user_id = _user_id
       AND a.period_end < now()
     ORDER BY a.period_end DESC
     LIMIT 1;

    IF FOUND THEN
      v_rollover := least(greatest(v_prev.tokens_granted - v_prev.tokens_used, 0), v_base);
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.ai_allowance_periods (
      user_id, period_start, period_end, tokens_granted, tokens_used, source, metadata
    ) VALUES (
      _user_id, v_start, v_end, v_base + v_rollover, 0, v_source,
      jsonb_build_object(
        'created_by',      _created_by,
        'created_at',      now(),
        'rollover_tokens', v_rollover,
        'base_tokens',     v_base
      )
    )
    RETURNING * INTO v_row;

    RETURN QUERY SELECT true, v_row.id, v_row.user_id, v_row.period_start,
                        v_row.period_end, v_row.tokens_granted, v_row.tokens_used,
                        v_row.source, v_row.metadata;
    RETURN;

  EXCEPTION WHEN unique_violation OR exclusion_violation THEN
    -- A concurrent caller got there first. Both constraints are caught: the
    -- unique one fires on an identical period, the exclusion one on any
    -- overlapping period, and which of the two wins a race is not something to
    -- depend on.
    SELECT * INTO v_row
      FROM public.ai_allowance_periods a
     WHERE a.user_id = _user_id
       AND tstzrange(a.period_start, a.period_end, '[)') && tstzrange(v_start, v_end, '[)')
     ORDER BY a.period_end DESC
     LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Allowance insert conflicted but no overlapping period could be read back for %', _user_id;
    END IF;

    RETURN QUERY SELECT false, v_row.id, v_row.user_id, v_row.period_start,
                        v_row.period_end, v_row.tokens_granted, v_row.tokens_used,
                        v_row.source, v_row.metadata;
    RETURN;
  END;
END;
$$;

COMMENT ON FUNCTION public.ensure_ai_allowance(uuid, bigint, timestamptz, timestamptz, text, boolean, text) IS
  'The only implementation of AI allowance provisioning. Reads user_roles for premium through is_premium_user(). Idempotent and safe to call concurrently. Findings M1, M6 and S4.';

REVOKE ALL ON FUNCTION public.ensure_ai_allowance(uuid, bigint, timestamptz, timestamptz, text, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_ai_allowance(uuid, bigint, timestamptz, timestamptz, text, boolean, text) FROM anon;
REVOKE ALL ON FUNCTION public.ensure_ai_allowance(uuid, bigint, timestamptz, timestamptz, text, boolean, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_ai_allowance(uuid, bigint, timestamptz, timestamptz, text, boolean, text) TO service_role;

-- ---------------------------------------------------------------------------
-- The old entry point keeps its signature, so its callers do not move
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.provision_ai_allowance(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.ensure_ai_allowance(_user_id, _created_by => 'provision_ai_allowance');
END;
$$;

COMMENT ON FUNCTION public.provision_ai_allowance(uuid) IS
  'Thin wrapper over ensure_ai_allowance, kept because the nightly cron job and the on_profile_created_allowance trigger call this signature.';

-- ---------------------------------------------------------------------------
-- One current period per user, not all of them
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_ai_allowance_current AS
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
  'The current allowance period, one row per user. _shared/llm.ts reads this with maybeSingle(), which errors on a second row, so a second row used to disable AI for that account permanently. Finding M5.';

-- ---------------------------------------------------------------------------
-- The charge path uses the same rate as the grant path
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_llm_usage(
  p_user_id uuid,
  p_idempotency_key text,
  p_feature text,
  p_provider text,
  p_model text,
  p_prompt_tokens bigint,
  p_completion_tokens bigint,
  p_total_tokens bigint,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tokens_per_credit int;
  v_credits_charged numeric;
  v_row_count int := 0;
  v_total bigint;
BEGIN
  v_total := coalesce(p_total_tokens, 0);
  IF v_total = 0 THEN
    v_total := coalesce(p_prompt_tokens, 0) + coalesce(p_completion_tokens, 0);
  END IF;

  -- Was a hardcoded 2000 here and a hardcoded 200 in the grant path.
  v_tokens_per_credit := public.tokens_per_credit();

  v_credits_charged := v_total::numeric / v_tokens_per_credit::numeric;

  INSERT INTO public.llm_usage_events (
    user_id, idempotency_key, feature, provider, model,
    prompt_tokens, completion_tokens, total_tokens,
    credits_charged, metadata
  ) VALUES (
    p_user_id, p_idempotency_key, p_feature, p_provider, p_model,
    coalesce(p_prompt_tokens, 0), coalesce(p_completion_tokens, 0), v_total,
    v_credits_charged, coalesce(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  IF v_row_count > 0 THEN
    UPDATE public.ai_allowance_periods
       SET tokens_used = coalesce(tokens_used, 0) + v_total,
           updated_at = now()
     WHERE user_id = p_user_id
       AND now() >= period_start
       AND now() <  period_end;
  END IF;
END;
$$;

-- record_llm_usage was revoked from ordinary users in an earlier migration and
-- must stay that way; CREATE OR REPLACE keeps the existing grants.
