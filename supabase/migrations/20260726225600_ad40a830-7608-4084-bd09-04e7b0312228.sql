CREATE OR REPLACE FUNCTION public.provision_ai_allowance(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start timestamptz := date_trunc('month', now() AT TIME ZONE 'utc');
  v_period_end   timestamptz := date_trunc('month', now() AT TIME ZONE 'utc') + interval '1 month';
  v_tokens_per_credit int;
  v_credits int;
  v_plan text;
  v_tokens bigint;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.ai_allowance_periods
    WHERE user_id = _user_id
      AND period_start <= now()
      AND period_end > now()
  ) THEN
    RETURN;
  END IF;

  SELECT COALESCE(value_int, 200) INTO v_tokens_per_credit
  FROM public.ai_credit_settings WHERE key = 'tokens_per_credit';
  v_tokens_per_credit := COALESCE(v_tokens_per_credit, 200);

  SELECT plan_type INTO v_plan FROM public.profiles WHERE id = _user_id;
  v_plan := COALESCE(v_plan, 'free');

  SELECT value_int INTO v_credits
  FROM public.ai_credit_settings
  WHERE key = CASE WHEN v_plan = 'premium' THEN 'credits_premium_per_month' ELSE 'credits_free_per_month' END;
  v_credits := COALESCE(v_credits, CASE WHEN v_plan = 'premium' THEN 1500 ELSE 0 END);

  v_tokens := v_credits::bigint * v_tokens_per_credit;

  INSERT INTO public.ai_allowance_periods (user_id, period_start, period_end, tokens_granted, tokens_used, source, metadata)
  VALUES (
    _user_id, v_period_start, v_period_end, v_tokens, 0,
    CASE WHEN v_plan = 'premium' THEN 'subscription' ELSE 'free_tier' END,
    jsonb_build_object('created_by', 'provision_ai_allowance', 'created_at', now(), 'rollover_tokens', 0, 'base_tokens', v_tokens)
  )
  ON CONFLICT ON CONSTRAINT ai_allowance_periods_user_period_unique DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_allowance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.provision_ai_allowance(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'provision_ai_allowance failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_allowance ON public.profiles;
CREATE TRIGGER on_profile_created_allowance
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_allowance();

-- Backfill: any existing profile without an active allowance period
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.id FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.ai_allowance_periods a
      WHERE a.user_id = p.id AND a.period_start <= now() AND a.period_end > now()
    )
  LOOP
    PERFORM public.provision_ai_allowance(r.id);
  END LOOP;
END $$;