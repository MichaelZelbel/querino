-- Author names and avatars are visible to logged-out visitors again, and the anon
-- grant is narrowed to the columns the public pages actually read.
--
-- Two changes, and they belong together.
--
-- 1. Narrow the grant from 20260824013000.
--
-- That migration gave anon the same 14 columns authenticated has, to stop the 42501
-- that was taking every public page down. It was safe at the time for a reason that
-- has now expired: row-level security admitted no anonymous reader, so the column list
-- decided nothing. The policy below changes that, and the moment rows become readable
-- the column list is the whole of the protection. So anon keeps exactly the seven
-- columns the anonymous-reachable queries select:
--
--   embedded author, on every public page:  id, display_name, avatar_url
--   the public profile page:                + bio, website, twitter, github
--
-- created_at is only read by the admin users panel, and the github_* sync settings only
-- by Settings. Both are authenticated surfaces, so anon loses them again here.
--
-- 2. Give anon its own SELECT policy.
--
-- "Users can view public profile info for content authors" (20260129173152) is
-- TO authenticated. That is why an anonymous visitor saw the artefact but no byline
-- even once the grant was back. This policy mirrors its three public-content branches
-- and deliberately does NOT mirror the fourth: team-mates can see each other, and team
-- membership is not public.
--
-- What this exposes, exactly: a profile row is readable by anon only if that person has
-- at least one public prompt, published skill or published workflow. Measured right
-- after applying, anon can see 2 profiles in total, not the user table. The
-- "reduce data harvesting risk" concern behind 20260129173152 survives: there is no
-- anonymous path to a profile that has published nothing.
--
-- Not covered, and worth a decision later: prompt_kits. Neither the authenticated
-- policy nor this one lists it, so the author of a prompt kit shows no byline unless
-- they also have a public prompt, skill or workflow. That gap predates both.
--
-- Applied to production 2026-08-24 and verified from the anon key: the author appears
-- on a public prompt, role/plan_type/plan_source stay 42501, github_repo stays 42501,
-- and the security suite is 132 green.

REVOKE SELECT (
  created_at, updated_at,
  github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at
) ON public.profiles FROM anon;

DROP POLICY IF EXISTS "Anonymous readers can view public content authors" ON public.profiles;

CREATE POLICY "Anonymous readers can view public content authors"
ON public.profiles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.author_id = profiles.id AND prompts.is_public = true
  )
  OR EXISTS (
    SELECT 1 FROM public.skills
    WHERE skills.author_id = profiles.id AND skills.published = true
  )
  OR EXISTS (
    SELECT 1 FROM public.workflows
    WHERE workflows.author_id = profiles.id AND workflows.published = true
  )
);
