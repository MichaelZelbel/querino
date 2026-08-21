-- The three structural rules, answerable without an account-wide credential.
--
-- tests/security/14 asks whether every SECURITY DEFINER function sets
-- search_path, every table in public has row-level security, and every view
-- runs as its caller. Those facts live in pg_catalog, which PostgREST does not
-- expose and should not.
--
-- The obvious way to read them is the Management API, but that needs
-- SUPABASE_ACCESS_TOKEN, which is scoped to the whole Supabase ACCOUNT rather
-- than to this project. This repository is public, and a credential that
-- reaches every project Michael owns does not belong in its CI secrets to save
-- writing this function. The service role key reaches this project and nothing
-- else, so it is the right size for the job.
--
-- Returns one row per violation and nothing at all when everything is right,
-- which is the state it is expected to be in.

CREATE OR REPLACE FUNCTION public.security_invariants()
RETURNS TABLE (kind text, name text, detail text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  -- A SECURITY DEFINER function runs as its owner, so without SET search_path
  -- the CALLER decides what its unqualified names resolve to.
  SELECT
    'function_without_search_path'::text,
    (n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')')::text,
    'SECURITY DEFINER with no SET search_path'::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND NOT EXISTS (
      SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) AS c WHERE c LIKE 'search_path=%'
    )

  UNION ALL

  -- Everything in public is reachable with the anon key, and the anon key is
  -- printed in the browser bundle.
  SELECT
    'table_without_rls'::text,
    c.relname::text,
    'no row-level security'::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity

  UNION ALL

  -- A view runs as its owner unless it says otherwise, and its owner is not
  -- subject to row-level security. Losing this option on v_ai_allowance_current
  -- is how this audit briefly published every user's credit balance.
  SELECT
    'view_without_security_invoker'::text,
    c.relname::text,
    'runs as its owner, so row-level security does not apply to its base tables'::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
    AND NOT EXISTS (
      SELECT 1 FROM unnest(coalesce(c.reloptions, '{}')) AS opt
      WHERE opt IN ('security_invoker=on', 'security_invoker=true')
    )

  UNION ALL

  -- Row-level security switched on with no policy denies every row to every
  -- user. Safe, and usually a sign somebody cleared a warning and stopped.
  -- github_sync_state is deliberate: only the worker touches it.
  SELECT
    'table_closed_to_everyone'::text,
    c.relname::text,
    'row-level security is on but no policy exists'::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity
    AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)

  ORDER BY 1, 2;
$$;

COMMENT ON FUNCTION public.security_invariants() IS
  'Every structural security rule this project holds itself to, as a list of the places it is broken. Empty means all of them hold. Read by tests/security/14. Service role only.';

REVOKE ALL ON FUNCTION public.security_invariants() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.security_invariants() FROM anon;
REVOKE ALL ON FUNCTION public.security_invariants() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.security_invariants() TO service_role;

-- A count, so a test can also assert there is something to be wrong about.
CREATE OR REPLACE FUNCTION public.security_invariants_scope()
RETURNS TABLE (security_definer_functions integer, public_tables integer, public_views integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
  SELECT
    (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prosecdef),
    (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'),
    (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm'));
$$;

REVOKE ALL ON FUNCTION public.security_invariants_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.security_invariants_scope() FROM anon;
REVOKE ALL ON FUNCTION public.security_invariants_scope() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.security_invariants_scope() TO service_role;
