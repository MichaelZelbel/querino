-- Drop and recreate the teams SELECT policy to include owners
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

CREATE POLICY "Users can view teams they belong to"
ON public.teams
FOR SELECT
USING (
  owner_id = auth.uid() 
  OR 
  id IN (
    SELECT team_members.team_id
    FROM team_members
    WHERE team_members.user_id = auth.uid()
  )
);

-- Drop and recreate team_members INSERT policy to allow owners to add themselves
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;

CREATE POLICY "Team owners and admins can add members"
ON public.team_members
FOR INSERT
WITH CHECK (
  -- Team owner can add any member (including themselves as owner)
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = team_id 
    AND teams.owner_id = auth.uid()
  )
  OR
  -- Existing admins can add new members  
  EXISTS (
    SELECT 1 FROM public.team_members existing
    WHERE existing.team_id = team_members.team_id
    AND existing.user_id = auth.uid()
    AND existing.role IN ('owner', 'admin')
  )
);

-- Drop and recreate team_members SELECT policy to allow viewing all members in your teams
DROP POLICY IF EXISTS "Users can view their own team memberships" ON public.team_members;

CREATE POLICY "Team members can view team members"
ON public.team_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  team_id IN (
    SELECT my_teams.team_id 
    FROM team_members my_teams 
    WHERE my_teams.user_id = auth.uid()
  )
);

-- Update the DELETE policy to also allow admins
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_members;

CREATE POLICY "Team owners and admins can remove members"
ON public.team_members
FOR DELETE
USING (
  (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = team_id 
      AND teams.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members existing
      WHERE existing.team_id = team_members.team_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
    )
  )
  -- Prevent owners from being removed
  AND role != 'owner'
);

-- Update the UPDATE policy to also allow admins
DROP POLICY IF EXISTS "Team owners can update members" ON public.team_members;

CREATE POLICY "Team owners and admins can update members"
ON public.team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = team_id 
    AND teams.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members existing
    WHERE existing.team_id = team_members.team_id
    AND existing.user_id = auth.uid()
    AND existing.role IN ('owner', 'admin')
  )
);