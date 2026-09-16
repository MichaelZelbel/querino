-- 20260823174224 narrowed what anon and authenticated may read from profiles
-- and left the five GitHub sync columns in the authenticated grant. The row
-- policy "Users can view public profile info for content authors" opens every
-- published author's row to every signed-in user, so a free account could list
-- the private repository name, branch and folder of everyone who has ever
-- published a prompt. 20260824021500 took the same columns away from anon and
-- did not touch authenticated. Found by the 2026-09-16 audit.
--
-- The five columns are read by exactly three places in the app, and all three
-- read the caller's own row (useAuth.ts, Settings.tsx, Library.tsx). They now
-- call get_my_github_settings(), which only ever answers about auth.uid(),
-- the same shape get_my_plan() took for role and plan_type. Writes are not
-- changed: the UPDATE grant stays, and the row policy already limits it to the
-- owner's row. The service role keeps the whole table, which is what the
-- github-sync functions use.

REVOKE SELECT (
  github_repo,
  github_branch,
  github_folder,
  github_sync_enabled,
  github_last_synced_at
) ON public.profiles FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_my_github_settings()
RETURNS TABLE (
  github_repo text,
  github_branch text,
  github_folder text,
  github_sync_enabled boolean,
  github_last_synced_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.github_repo,
         p.github_branch,
         p.github_folder,
         p.github_sync_enabled,
         p.github_last_synced_at
    FROM public.profiles p
   WHERE p.id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.get_my_github_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_github_settings() TO authenticated, service_role;
