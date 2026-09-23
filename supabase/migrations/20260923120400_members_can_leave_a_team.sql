-- A member can leave a team (2026-09-23).
--
-- The only DELETE policy on team_members is "Team owners and admins can remove
-- members" (20260106222027): an owner or admin removes someone else. Nobody
-- could take themselves out, so leaving a team meant asking its owner. The
-- Leave button deletes the caller's own row
--   DELETE FROM team_members WHERE team_id = X AND user_id = auth.uid()
-- and this policy allows exactly that, for every role but 'owner'. An owner
-- who leaves would leave a team nobody can administer; the owner deletes the
-- team, or hands the owner role over first (only the owner can, see
-- refuse_team_membership_identity_change in 20260908230000).
--
-- Policies are OR-ed, so this adds a right and takes none away.

DROP POLICY IF EXISTS "Members can leave a team" ON public.team_members;
CREATE POLICY "Members can leave a team"
  ON public.team_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND role <> 'owner'
  );
