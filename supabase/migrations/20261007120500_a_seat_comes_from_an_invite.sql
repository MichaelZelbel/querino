-- A seat on a team comes from an invite the person accepted (2026-10-07
-- review).
--
-- What was wrong. The INSERT policy on team_members let a team's owner or
-- admin insert a seat for ANY Premium user_id: anyone could be put on a team,
-- and shown its content and activity, without being asked. Because the insert
-- only succeeds for Premium accounts, it also told the inserter who has
-- Premium. The app never does this: members join by redeeming an invite
-- (redeem_team_invite, a definer function that skips this policy), and the
-- one hook that inserted a seat for someone else, useAddTeamMemberById, was
-- called from nowhere and goes in the same commit.
--
-- How it was measured. The live policy text, read from pg_policies. Every
-- seat in production today is an owner's own seat or came from an invite.
--
-- What it changes. The browser may insert exactly one kind of seat: a Premium
-- owner taking the owner seat of a team they own, which is what creating a
-- team does (useCreateTeam). Everyone else arrives through an invite.

DROP POLICY IF EXISTS "Only premium users can add premium members" ON public.team_members;
DROP POLICY IF EXISTS "An owner takes their own seat" ON public.team_members;

CREATE POLICY "An owner takes their own seat"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_premium_user(auth.uid())
    AND role = 'owner'
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.teams t
       WHERE t.id = team_members.team_id
         AND t.owner_id = auth.uid()
    )
  );
