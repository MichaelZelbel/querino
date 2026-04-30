-- Helper RPC to atomically record an LLM usage event AND increment the user's
-- current allowance period token counter. Used by edge functions that call AI
-- gateways directly (replacing the previous n8n "Update Token Usage" workflow).

CREATE OR REPLACE FUNCTION public.record_llm_usage(
  p_user_id uuid,
  p_idempotency_key text,
  p_feature text,
  p_provider text,
  p_model text,
  p_prompt_tokens bigint,
  p_completion_tokens bigint,
  p_total_tokens bigint DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total bigint;
  v_tokens_per_credit int;
  v_milli_credits bigint;
  v_credits numeric(18,6);
  v_event_id uuid;
  v_inserted boolean := true;
BEGIN
  IF p_user_id IS NULL OR p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    RAISE EXCEPTION 'user_id and idempotency_key are required';
  END IF;

  v_total := COALESCE(p_total_tokens, COALESCE(p_prompt_tokens, 0) + COALESCE(p_completion_tokens, 0));

  -- Look up current tokens_per_credit (default 200, matching v_ai_allowance_current)
  SELECT COALESCE(value_int, 200)
    INTO v_tokens_per_credit
    FROM public.ai_credit_settings
    WHERE key = 'tokens_per_credit'
    LIMIT 1;
  v_tokens_per_credit := COALESCE(v_tokens_per_credit, 200);

  -- milli_credits = round(total_tokens * 1000 / tokens_per_credit)
  v_milli_credits := ROUND(v_total::numeric * 1000.0 / NULLIF(v_tokens_per_credit, 0));
  v_credits := (v_milli_credits::numeric / 1000.0);

  -- Idempotent insert
  INSERT INTO public.llm_usage_events (
    user_id, idempotency_key, feature, provider, model,
    prompt_tokens, completion_tokens, total_tokens,
    milli_credits_charged, credits_charged, metadata
  )
  VALUES (
    p_user_id, p_idempotency_key, p_feature, p_provider, p_model,
    COALESCE(p_prompt_tokens, 0), COALESCE(p_completion_tokens, 0), v_total,
    v_milli_credits, v_credits, COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    -- Already recorded for this idempotency key; do not double-charge
    v_inserted := false;
    SELECT id INTO v_event_id FROM public.llm_usage_events
      WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
  ELSE
    -- Increment current allowance period (most recent active period for this user)
    UPDATE public.ai_allowance_periods
       SET tokens_used = tokens_used + v_total,
           milli_credits_used = milli_credits_used + v_milli_credits,
           updated_at = now()
     WHERE id = (
       SELECT id FROM public.ai_allowance_periods
        WHERE user_id = p_user_id
          AND period_start <= now()
          AND period_end > now()
        ORDER BY period_end DESC
        LIMIT 1
     );
  END IF;

  RETURN jsonb_build_object(
    'event_id', v_event_id,
    'inserted', v_inserted,
    'total_tokens', v_total,
    'milli_credits_charged', v_milli_credits,
    'credits_charged', v_credits,
    'tokens_per_credit', v_tokens_per_credit
  );
END;
$$;

-- Allow authenticated users to invoke (the function uses SECURITY DEFINER and
-- only writes for the user_id passed; edge functions should ALWAYS pass the
-- authenticated caller's id derived from the validated JWT, never trust client).
GRANT EXECUTE ON FUNCTION public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb) TO authenticated, service_role;