-- A correction to 20260909010000, finding 24, and the honest limit of it.
--
-- That migration wrote REVOKE EXECUTE ... FROM anon for seven predicates. It
-- had no effect. Postgres grants EXECUTE on a new function to PUBLIC, and anon
-- holds it through PUBLIC, so revoking from anon by name removes a grant that
-- was never made. The privilege check afterwards still said true. Revoking
-- from PUBLIC and granting back to the roles that need it is the form that
-- works, and it is the form the rest of this repository already uses
-- (20260823174224, 20260823210000).
--
-- Two of the seven are closed here:
--
--   get_user_role(uuid)  returns 'admin', 'premium' or 'free' for any user id
--   has_role(uuid, app_role)  answers the same question as a yes or no
--
-- Author ids are on every public card, so these were a public lookup of who is
-- an admin. Neither is named in any policy, and neither is called from the app
-- or the edge functions, so nothing else moves.
--
-- The other five stay callable, and this is the reason rather than an
-- oversight. is_admin, is_premium_user, is_team_member, is_team_owner and
-- is_team_admin_or_owner appear inside 49 policies that are written for the
-- PUBLIC role. A policy expression is evaluated as the querying role, so a
-- logged-out visitor evaluates them and needs EXECUTE. Revoking from PUBLIC
-- was tried against the live schema first and an anonymous read of the prompts
-- table failed immediately with "permission denied for function
-- is_premium_user". Closing them means first rewriting those 49 policies to
-- apply TO authenticated, which is correct (a premium or team test on
-- auth.uid() means nothing for a logged-out reader) but is a change to every
-- access rule in the product, and it is not something to do in the same pass
-- as the fix it would support. What is left open is the ability to ask whether
-- a given user id is premium, an admin, or in a given team. It is a lookup, not
-- a way in.
--
-- Verified before applying: with the two revokes below in place, an anonymous
-- session reads the same counts as it does today. 101 prompts, 5 skills, 1
-- workflow, 0 kits, 0 posts, 2 profiles, 0 collections, 4 reviews, 0 comments
-- and 461 models.

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_user_role(uuid) IS
  'Returns a user''s role. Not executable by anon since 2026-09-09: it answered for any user id, and author ids are public.';
