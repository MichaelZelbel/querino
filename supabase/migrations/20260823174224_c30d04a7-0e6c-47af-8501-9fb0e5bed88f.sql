-- 1. Lock down SECURITY DEFINER RPCs to the service role only
REVOKE EXECUTE ON FUNCTION public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_embedding(text, uuid, vector) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_embedding(text, uuid, vector) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_llm_usage(uuid, text, text, text, text, bigint, bigint, bigint, jsonb) TO service_role;

-- 2. Column-level security on profiles: role / plan_type / plan_source are no
-- longer readable by other users (the team-member + content-author policy
-- previously exposed the whole row).
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, display_name, avatar_url, bio, website, twitter, github,
  created_at, updated_at,
  github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Self-service access to your own plan/role without exposing the columns broadly
CREATE OR REPLACE FUNCTION public.get_my_plan()
RETURNS TABLE(role text, plan_type text, plan_source text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role, p.plan_type, p.plan_source
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_plan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_plan() TO authenticated, service_role;