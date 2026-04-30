drop function if exists public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb);

create function public.record_llm_usage(
  p_user_id uuid,
  p_idempotency_key text,
  p_feature text,
  p_provider text,
  p_model text,
  p_prompt_tokens bigint,
  p_completion_tokens bigint,
  p_total_tokens bigint,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tokens_per_credit int;
  v_credits_charged numeric;
  v_row_count int := 0;
  v_total bigint;
begin
  v_total := coalesce(p_total_tokens, 0);
  if v_total = 0 then
    v_total := coalesce(p_prompt_tokens,0) + coalesce(p_completion_tokens,0);
  end if;

  select coalesce(value_int, 2000) into v_tokens_per_credit
  from public.ai_credit_settings where key = 'tokens_per_credit';
  if v_tokens_per_credit is null or v_tokens_per_credit <= 0 then
    v_tokens_per_credit := 2000;
  end if;

  v_credits_charged := v_total::numeric / v_tokens_per_credit::numeric;

  insert into public.llm_usage_events (
    user_id, idempotency_key, feature, provider, model,
    prompt_tokens, completion_tokens, total_tokens,
    credits_charged, metadata
  ) values (
    p_user_id, p_idempotency_key, p_feature, p_provider, p_model,
    coalesce(p_prompt_tokens,0), coalesce(p_completion_tokens,0), v_total,
    v_credits_charged, coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, idempotency_key) do nothing;

  get diagnostics v_row_count = row_count;

  if v_row_count > 0 then
    update public.ai_allowance_periods
    set tokens_used = coalesce(tokens_used, 0) + v_total,
        updated_at = now()
    where user_id = p_user_id
      and now() >= period_start
      and now() < period_end;
  end if;
end;
$$;

create unique index if not exists llm_usage_events_user_idem_uidx
  on public.llm_usage_events (user_id, idempotency_key);

revoke all on function public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb) to service_role;