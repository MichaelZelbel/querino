-- Correction to 20260909030000, caught by the security suite the same hour.
--
-- It also supersedes the reasoning in 20260909020000, which said the five
-- predicates below had to stay open because closing them by revoking EXECUTE
-- takes the public site down. That much is true and still is. Closing them by
-- changing the answer rather than the privilege is the way through, and this
-- is it. Only get_user_role and has_role were closed the other way.
--
-- That migration closed the "is this person premium / an admin" oracle by
-- requiring auth.uid() to be present. The oracle did close, and every public
-- page kept working. What it also did was break every admin path, because an
-- edge function checks admin-ness through its service-role client and a
-- service-role call has no auth.uid() at all. Seven tests went red at once,
-- all of them "Forbidden - admin only": the job trigger buttons, the LLM
-- config panel and the AI usage view.
--
-- The thing being kept out was never "a caller with no session". It was the
-- anonymous role, the one holding the key that ships in the browser bundle.
-- So that is what these ask now. PostgREST puts the caller's role in the JWT
-- claims, so 'anon' is visible and nothing else has to be guessed. A direct
-- database connection (pg_cron, a migration) sets no claims at all and is
-- therefore not anon, which is right: those are trusted callers.
--
-- ensure_ai_allowance keeps calling is_premium_user_unchecked. It is the same
-- answer either way now, and the explicit name says at the call site that the
-- nightly job is deliberately not subject to a caller check.

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(
           current_setting('request.jwt.claims', true)::jsonb ->> 'role',
           ''
         ) <> 'anon'
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
  SELECT coalesce(
           current_setting('request.jwt.claims', true)::jsonb ->> 'role',
           ''
         ) <> 'anon'
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
  SELECT coalesce(
           current_setting('request.jwt.claims', true)::jsonb ->> 'role',
           ''
         ) <> 'anon'
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
  SELECT coalesce(
           current_setting('request.jwt.claims', true)::jsonb ->> 'role',
           ''
         ) <> 'anon'
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
  SELECT coalesce(
           current_setting('request.jwt.claims', true)::jsonb ->> 'role',
           ''
         ) <> 'anon'
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
