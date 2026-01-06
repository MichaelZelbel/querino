-- Create a security definer function to check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id AND owner_id = p_user_id
  )
$$;

-- Create a security definer function to check if user is team admin or owner
CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams WHERE id = p_team_id AND owner_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = p_team_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  )
$$;

-- Create a security definer function to check if user is a team member
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  )
$$;

-- Drop all existing team_members policies
DROP POLICY IF EXISTS "Team owners and admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners and admins can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners and admins can update members" ON public.team_members;

-- Recreate policies using the security definer functions
CREATE POLICY "Team owners and admins can add members"
ON public.team_members
FOR INSERT
WITH CHECK (
  public.is_team_owner(team_id, auth.uid())
);

CREATE POLICY "Team members can view team members"
ON public.team_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_team_member(team_id, auth.uid())
);

CREATE POLICY "Team owners and admins can update members"
ON public.team_members
FOR UPDATE
USING (
  public.is_team_admin_or_owner(team_id, auth.uid())
);

CREATE POLICY "Team owners and admins can remove members"
ON public.team_members
FOR DELETE
USING (
  public.is_team_admin_or_owner(team_id, auth.uid())
  AND role != 'owner'
);