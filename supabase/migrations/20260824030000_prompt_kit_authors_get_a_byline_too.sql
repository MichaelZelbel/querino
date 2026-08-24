-- Prompt kit authors get a byline, in both profile policies.
--
-- "Users can view public profile info for content authors" (20260129173152) lists
-- prompts, skills and workflows, and never listed prompt_kits. So the author of a
-- prompt kit shows no byline, and not only to logged-out visitors: a signed-in one sees
-- none either, unless that person also happens to have a public prompt, skill or
-- workflow. The gap predates the anonymous policy added in 20260824021500, which
-- faithfully mirrored it and therefore inherited it.
--
-- Both policies gain the same fourth branch. ALTER POLICY rather than DROP and CREATE,
-- so there is no instant where profiles has no policy at all.
--
-- The authenticated policy keeps its team-mate branch, which the anonymous one still
-- deliberately does not have: team membership is not public.
--
-- What this exposes today: nothing. Measured before applying, prompt_kits holds 0 rows,
-- published or otherwise, and 0 people would become newly visible. It is written now so
-- that the first published prompt kit carries its author, rather than someone finding a
-- missing byline later and having to rediscover why.
--
-- Applied to production 2026-08-24. Verified after: an anonymous visitor still sees
-- exactly 2 profiles, being the two people with published content; role, plan_type,
-- plan_source and the github sync settings still answer 42501; the security suite is
-- green, now including tests/security/22-the-public-pages-work-logged-out.spec.ts,
-- which is the regression guard this whole sequence was missing.

ALTER POLICY "Anonymous readers can view public content authors"
ON public.profiles
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
  OR EXISTS (
    SELECT 1 FROM public.prompt_kits
    WHERE prompt_kits.author_id = profiles.id AND prompt_kits.published = true
  )
);

ALTER POLICY "Users can view public profile info for content authors"
ON public.profiles
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
  OR EXISTS (
    SELECT 1 FROM public.prompt_kits
    WHERE prompt_kits.author_id = profiles.id AND prompt_kits.published = true
  )
  OR EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
  )
);
