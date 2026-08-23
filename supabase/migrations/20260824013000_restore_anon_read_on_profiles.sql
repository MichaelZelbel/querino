-- Restores anonymous SELECT on public.profiles.
--
-- 20260823174224 hardened column-level access on profiles. It ran
--
--   REVOKE SELECT ON public.profiles FROM anon, authenticated;
--   GRANT  SELECT (...) ON public.profiles TO authenticated;
--
-- revoking from both roles and granting back to one. anon was never re-granted.
--
-- Every public page loads its author in the same query as the artefact
-- (`.select("*, profiles:author_id ( id, display_name, avatar_url )")`), and PostgREST
-- fails the WHOLE query when one embedded table is denied. So a missing grant did not
-- hide the author, it took the page down: every prompt, skill and workflow detail page
-- rendered "Not Found" with robots noindex,nofollow to a logged-out visitor, and
-- /discover rendered "Failed to load prompts" and listed nothing. Signed in it all
-- looked fine, which is how it survived a night.
--
-- Granted here: exactly the same 14 columns 20260823174224 granted to authenticated.
-- role, plan_type and plan_source stay ungranted to anon and authenticated alike, so
-- the hardening this repairs keeps everything it was written to keep.
--
-- Row-level security is untouched and still admits no anonymous reader: the SELECT
-- policy "Users can view public profile info for content authors" is TO authenticated,
-- as it has been since 20260129173152. So anon gets an empty author rather than an
-- error, which is exactly how the site behaved before 2026-08-23. Whether author names
-- should be visible to logged-out visitors is a separate product decision and is
-- deliberately not made here.
--
-- Applied to production 2026-08-24 and verified with migration/prodcheck.mjs:
-- 5 of 5 checked pages went from "Not Found" back to their real content.

GRANT SELECT (
  id, display_name, avatar_url, bio, website, twitter, github,
  created_at, updated_at,
  github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at
) ON public.profiles TO anon;
