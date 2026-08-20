-- Phase 0 hardening, 2026-08-20.
--
-- Two changes, both closing the same hole from different sides:
--
-- 1. `profiles.plan_type` decides how many AI credits a user is granted
--    (public.provision_ai_allowance, _shared/allowance.ts, ensure-token-allowance).
--    The RLS policy on profiles is USING (auth.uid() = id) with no column list,
--    which made plan_type self-writable and therefore a way to raise your own
--    AI allowance. is_admin() and is_premium_user() already read user_roles, so
--    admin and team features were never affected, but credit grants were.
--    Phase 2 removes the dependency on this column entirely; this trigger is the
--    immediate guard.
--
-- 2. The nightly allowance job called the ensure-token-allowance edge function
--    over HTTP using the PUBLIC anon key, which ships in the frontend bundle.
--    That made `{"batch_init": true}` reachable by anyone, and it returned every
--    user id. The edge function now requires the service role key. Rather than
--    put THAT key in a migration file (the same mistake, one step worse), the
--    job is moved into the database, where public.provision_ai_allowance already
--    does the identical work atomically and needs no key at all.

-- ---------------------------------------------------------------------------
-- 1. Guard the privileged profile columns
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_privileged_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_type   IS DISTINCT FROM OLD.plan_type
  OR NEW.role        IS DISTINCT FROM OLD.role
  OR NEW.plan_source IS DISTINCT FROM OLD.plan_source
  THEN
    -- auth.uid() is NULL for the service role, for pg_cron and for migrations,
    -- which all need to keep working. An anonymous web caller cannot reach this
    -- point at all: the RLS policy USING (auth.uid() = id) rejects them first.
    IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION
        'plan_type, role and plan_source can only be changed by an admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_privileged_profile_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_privileged_profile_columns ON public.profiles;
CREATE TRIGGER guard_privileged_profile_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_privileged_profile_columns();

-- ---------------------------------------------------------------------------
-- 2. Move the nightly allowance job into the database
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  PERFORM cron.unschedule('daily-token-allowance-reset');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-token-allowance-reset',
  '5 0 * * *',
  $job$
  DO $inner$
  DECLARE r record;
  BEGIN
    FOR r IN
      SELECT p.id
        FROM public.profiles p
       WHERE NOT EXISTS (
         SELECT 1
           FROM public.ai_allowance_periods a
          WHERE a.user_id = p.id
            AND a.period_start <= now()
            AND a.period_end   >  now()
       )
    LOOP
      -- Idempotent per user, and one failure must not abort the whole sweep.
      BEGIN
        PERFORM public.provision_ai_allowance(r.id);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'daily allowance provisioning failed for %: %', r.id, SQLERRM;
      END;
    END LOOP;
  END
  $inner$;
  $job$
);
