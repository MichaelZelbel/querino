-- A reservation is settled in the allowance period it was taken from
-- (2026-09-30 audit, left open by the 2026-09-23 review).
--
-- callLovableAI and generate-embedding hold an estimate in the CURRENT period
-- (reserve_llm_credits), call the provider, then settle or release it in the
-- period that is current when the call ENDS (record_llm_usage and
-- release_llm_credits both match on now()). A call that straddles midnight UTC
-- on the 1st left the whole estimate charged to the old month and settled
-- "actual minus estimate", floored at zero, against the new one: the old month
-- paid the estimate instead of the real cost, the new month paid nothing.
--
-- reserve_llm_credits_in_period does what reserve_llm_credits does and says
-- which period it charged. record_llm_usage and release_llm_credits take that
-- id as an optional last argument and, when given, settle there. Without it
-- they behave exactly as before, so the deployed edge functions keep working
-- until they switch; the old reserve_llm_credits stays for them.
--
-- The two changed signatures are dropped and recreated rather than replaced:
-- CREATE OR REPLACE with an extra argument would add a second overload, and
-- PostgREST refuses to choose between two functions that both match a call.

CREATE OR REPLACE FUNCTION public.reserve_llm_credits_in_period(p_user_id uuid, p_tokens bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL OR p_tokens IS NULL OR p_tokens <= 0 THEN
    RETURN NULL;
  END IF;

  UPDATE public.ai_allowance_periods ap
     SET tokens_used = coalesce(ap.tokens_used, 0) + p_tokens,
         updated_at  = now()
   WHERE ap.id = (
           SELECT c.id FROM public.ai_allowance_periods c
            WHERE c.user_id = p_user_id
              AND c.period_start <= now() AND c.period_end > now()
            ORDER BY c.period_end DESC
            LIMIT 1)
     AND ap.tokens_granted - coalesce(ap.tokens_used, 0) >= p_tokens
  RETURNING ap.id INTO v_id;

  RETURN v_id;  -- NULL: refused, or no current period
END;
$$;

DROP FUNCTION IF EXISTS public.release_llm_credits(uuid, bigint);
CREATE FUNCTION public.release_llm_credits(p_user_id uuid, p_tokens bigint, p_period_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL OR p_tokens IS NULL OR p_tokens <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.ai_allowance_periods
     SET tokens_used = greatest(0, coalesce(tokens_used, 0) - p_tokens),
         updated_at  = now()
   WHERE user_id = p_user_id
     AND CASE WHEN p_period_id IS NOT NULL THEN id = p_period_id
              ELSE now() >= period_start AND now() < period_end END;
END;
$$;

DROP FUNCTION IF EXISTS public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb, bigint);
CREATE FUNCTION public.record_llm_usage(
  p_user_id uuid, p_idempotency_key text, p_feature text, p_provider text, p_model text,
  p_prompt_tokens bigint, p_completion_tokens bigint, p_total_tokens bigint,
  p_metadata jsonb DEFAULT '{}'::jsonb, p_reserved_tokens bigint DEFAULT 0,
  p_period_id uuid DEFAULT NULL)
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
  v_reserved bigint := greatest(coalesce(p_reserved_tokens, 0), 0);
BEGIN
  v_total := coalesce(p_total_tokens, 0);
  IF v_total = 0 THEN
    v_total := coalesce(p_prompt_tokens, 0) + coalesce(p_completion_tokens, 0);
  END IF;

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

  IF v_row_count > 0 OR v_reserved > 0 THEN
    UPDATE public.ai_allowance_periods
       SET tokens_used = greatest(0, coalesce(tokens_used, 0)
                                     + CASE WHEN v_row_count > 0 THEN v_total ELSE 0 END
                                     - v_reserved),
           updated_at = now()
     WHERE user_id = p_user_id
       AND CASE WHEN p_period_id IS NOT NULL THEN id = p_period_id
                ELSE now() >= period_start AND now() < period_end END;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_llm_credits_in_period(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_llm_credits(uuid, bigint, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb, bigint, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_llm_credits_in_period(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_llm_credits(uuid, bigint, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb, bigint, uuid) TO service_role;
