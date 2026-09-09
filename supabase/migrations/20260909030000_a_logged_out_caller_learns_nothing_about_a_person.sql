-- Finding 24 of the 2026-09-08 audit, finished properly.
--
-- The first attempt (20260909010000) revoked EXECUTE on these predicates from
-- `anon`. For two of them that worked. For the other five it did nothing at
-- all, because the grant they are reached through is the owner's default grant
-- to PUBLIC, and revoking from a role does not take away what PUBLIC gives it.
-- So `POST /rpc/is_premium_user` with any author id, and author ids are on
-- every public card, still answered a logged-out caller.
--
-- Revoking from PUBLIC instead is not the fix: it takes the site down. Every
-- artifact table carries a permissive SELECT policy that calls
-- is_premium_user, and profiles and blog_posts call is_admin, and a policy is
-- evaluated with the querying role's privileges. Measured here before writing
-- this, each one inside a transaction that was rolled back: with PUBLIC
-- revoked, a logged-out read of prompts, profiles, skills, workflows, prompt
-- kits, collections and blog posts each failed with
-- "42501: permission denied for function is_premium_user". That is the whole
-- public site, and it is the same shape as the outage of 2026-08-24.
--
-- So the privilege stays and the answer changes. Every one of these questions
-- is asked by a policy as `<predicate>(auth.uid())`, and for a logged-out
-- caller auth.uid() is NULL, so the honest answer to a policy has always been
-- false. The only caller that learns anything from passing somebody else's id
-- is one asking directly over PostgREST. A caller with no session now gets
-- false whatever it asks about, which is exactly what it was already entitled
-- to know.
--
-- Signed-in callers are unchanged on purpose: "Only premium users can add
-- premium members" asks is_premium_user about the person being added, not
-- about the caller, so restricting these to the caller's own id would break
-- adding a member to a team.

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'admin'
     )
$function$;

CREATE OR REPLACE FUNCTION public.is_premium_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('premium', 'premium_gift', 'admin')
     )
$function$;

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.team_members
        WHERE team_id = p_team_id AND user_id = p_user_id
     )
$function$;

CREATE OR REPLACE FUNCTION public.is_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.teams
        WHERE id = p_team_id AND owner_id = p_user_id
     )
$function$;

CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND (
       EXISTS (
         SELECT 1 FROM public.teams
          WHERE id = p_team_id AND owner_id = p_user_id
       )
       OR EXISTS (
         SELECT 1 FROM public.team_members
          WHERE team_id = p_team_id AND user_id = p_user_id
            AND role IN ('owner', 'admin')
       )
     )
$function$;

-- The service role has no auth.uid() and must keep getting real answers: the
-- job that provisions allowances asks is_premium_user about each account.
-- SECURITY DEFINER functions called by other SECURITY DEFINER functions are
-- unaffected by the clause above only when a session exists, so the machine
-- path gets its own name rather than a special case inside these five.
CREATE OR REPLACE FUNCTION public.is_premium_user_unchecked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = _user_id
       AND role IN ('premium', 'premium_gift', 'admin')
  )
$function$;

REVOKE ALL ON FUNCTION public.is_premium_user_unchecked(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_premium_user_unchecked(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_premium_user_unchecked(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium_user_unchecked(uuid) TO service_role;

COMMENT ON FUNCTION public.is_premium_user_unchecked(uuid) IS
  'is_premium_user without the "there must be a session" clause, for machine callers that have no auth.uid(). Service role only.';

-- ensure_ai_allowance decides how many credits an account gets each month, and
-- the job that calls it is pg_cron holding the service key, which has no
-- auth.uid(). With the clause above and no change here, every account would
-- have been provisioned at the free rate from the next nightly run, premium
-- included. It asks the unchecked variant instead. This is the live definition
-- of the function with that one call swapped, and nothing else touched.

CREATE OR REPLACE FUNCTION public.ensure_ai_allowance(_user_id uuid, _force_tokens bigint DEFAULT NULL::bigint, _period_start timestamp with time zone DEFAULT NULL::timestamp with time zone, _period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, _source text DEFAULT NULL::text, _skip_rollover boolean DEFAULT false, _created_by text DEFAULT 'ensure_ai_allowance'::text)
 RETURNS TABLE(created boolean, id uuid, user_id uuid, period_start timestamp with time zone, period_end timestamp with time zone, tokens_granted bigint, tokens_used bigint, source text, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  v_start := COALESCE(_period_start, date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
  v_end   := COALESCE(_period_end,   (date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month') AT TIME ZONE 'UTC');

  v_tpc := public.tokens_per_credit();

  v_premium := public.is_premium_user_unchecked(_user_id);

  SELECT value_int INTO v_credits
    FROM public.ai_credit_settings
   WHERE key = CASE WHEN v_premium THEN 'credits_premium_per_month' ELSE 'credits_free_per_month' END;

  v_credits := COALESCE(v_credits, CASE WHEN v_premium THEN 1500 ELSE 500 END);

  v_base := COALESCE(_force_tokens, v_credits::bigint * v_tpc);
  IF v_base < 0 THEN
    RAISE EXCEPTION 'A negative allowance cannot be granted' USING ERRCODE = 'check_violation';
  END IF;

  v_source := COALESCE(_source, CASE WHEN v_premium THEN 'subscription' ELSE 'free_tier' END);

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
$function$
;
