-- The early-access sign-up cap is enforced where accounts are made
-- (2026-09-30, Michael's decision after the audit of the same day).
--
-- What was wrong. The cap (ai_credit_settings.max_free_accounts, 100 today,
-- 24 accounts) was only checked by the browser: the sign-up form asked
-- check_signup_allowed first, and an OAuth sign-up was signed out again
-- afterwards. Anyone calling Supabase Auth directly, or simply not running the
-- page's script, got an account however many existed.
--
-- What it changes. Supabase Auth's "before user created" hook calls this
-- function for every new user, whatever the sign-up method, and refuses the
-- account with a clear message once the cap is reached. It counts profiles,
-- the same count check_signup_allowed shows the form. It runs as its owner so
-- it can count them; only the auth server may call it. The hook itself is
-- switched on in the project's auth settings (hook_before_user_created_uri =
-- pg-functions://postgres/public/hook_before_user_created), which is not SQL.

CREATE OR REPLACE FUNCTION public.hook_before_user_created(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_count integer;
  v_max integer;
BEGIN
  SELECT count(*)::integer INTO v_count FROM public.profiles;
  SELECT coalesce(
    (SELECT value_int FROM public.ai_credit_settings WHERE key = 'max_free_accounts'),
    1000
  ) INTO v_max;

  IF v_count >= v_max THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'We''ve reached our early access limit. Join the waitlist at support@querino.ai.'
      )
    );
  END IF;
  RETURN '{}'::jsonb;
END;
$fn$;

REVOKE ALL ON FUNCTION public.hook_before_user_created(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hook_before_user_created(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.hook_before_user_created(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) TO supabase_auth_admin;
