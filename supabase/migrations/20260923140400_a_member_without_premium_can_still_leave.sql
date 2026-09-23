-- A member whose premium lapsed can still leave a team (2026-09-23).
--
-- 20260923120400 gave members a DELETE policy for their own row. It never
-- worked for the people most likely to want it: a DELETE only reaches rows
-- the caller can also SELECT, and the only SELECT policy on team_members is
-- "Premium team members can view team members", which requires
-- is_premium_user(auth.uid()). Someone whose premium ran out could not see
-- their own membership, so the Leave button deleted nothing and said nothing.
--
-- The SELECT policy stays as it is: widening it would show non-premium users
-- the member lists that are a premium feature. Instead leave_team does the
-- one thing leaving needs, as its owner, for the caller only: it deletes the
-- row with user_id = auth.uid() in the named team, never an 'owner' row (an
-- owner who left would leave a team nobody can administer; see
-- 20260923120400). When nothing was deleted it says why, so the button can
-- tell the person instead of appearing to work. The identity comes from
-- auth.uid(), never from an argument.

CREATE OR REPLACE FUNCTION public.leave_team(p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_deleted integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to leave a team'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.team_members tm
   WHERE tm.team_id = p_team_id
     AND tm.user_id = v_uid
     AND tm.role <> 'owner';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.team_members tm
       WHERE tm.team_id = p_team_id
         AND tm.user_id = v_uid
         AND tm.role = 'owner'
    ) THEN
      RAISE EXCEPTION 'The owner cannot leave the team; transfer ownership or delete the team instead'
        USING ERRCODE = 'P0001';
    END IF;
    RAISE EXCEPTION 'You are not a member of this team'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.leave_team(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_team(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.leave_team(uuid) TO authenticated;

COMMENT ON FUNCTION public.leave_team(uuid) IS
  'Removes the caller''s own non-owner membership of a team. Works without premium, which the team_members SELECT policy requires. Raises when nothing was removed (not a member, or the owner). 2026-09-23.';
