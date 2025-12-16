-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Team members can view their team's members" ON public.team_members;

-- Create a non-recursive policy: users can only see their own membership rows
CREATE POLICY "Users can view their own team memberships"
ON public.team_members FOR SELECT
USING (user_id = auth.uid());

-- Also fix the INSERT policy that has similar recursion issues
DROP POLICY IF EXISTS "Team owners and admins can add members" ON public.team_members;

-- Simplified: team owners can add members (check teams table directly, not team_members)
CREATE POLICY "Team owners can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_id AND teams.owner_id = auth.uid()
  )
);

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Team owners and admins can update members" ON public.team_members;

CREATE POLICY "Team owners can update members"
ON public.team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_id AND teams.owner_id = auth.uid()
  )
);

-- Fix DELETE policy
DROP POLICY IF EXISTS "Team owners and admins can remove members" ON public.team_members;

CREATE POLICY "Team owners can remove members"
ON public.team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_id AND teams.owner_id = auth.uid()
  )
);