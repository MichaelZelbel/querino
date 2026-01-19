-- Create a security definer function to check if user is premium
-- This avoids RLS recursion issues when checking profile data
CREATE OR REPLACE FUNCTION public.is_premium_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = check_user_id
      AND plan_type = 'premium'
  )
$$;

-- Drop old permissive team creation policy
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

-- New policy: Only premium users can create teams
CREATE POLICY "Only premium users can create teams"
ON public.teams
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id
  AND public.is_premium_user(auth.uid())
);

-- Drop old team member add policy and recreate with premium check
DROP POLICY IF EXISTS "Team owners and admins can add members" ON public.team_members;

-- New policy: Only premium users can add team members, and the user being added must also be premium
CREATE POLICY "Only premium users can add premium members"
ON public.team_members
FOR INSERT
WITH CHECK (
  -- The user adding must be premium
  public.is_premium_user(auth.uid())
  AND
  -- The user being added must also be premium
  public.is_premium_user(user_id)
  AND
  (
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
  )
);

-- Update SELECT policy to also check premium status
-- Drop old policies first
DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Team members can view team prompts" ON public.prompts;
DROP POLICY IF EXISTS "Team members can view team skills" ON public.skills;
DROP POLICY IF EXISTS "Team members can view team workflows" ON public.workflows;
DROP POLICY IF EXISTS "Team members can view team collections" ON public.collections;

-- Recreate with premium check
CREATE POLICY "Premium team members can view team members"
ON public.team_members
FOR SELECT
USING (
  (user_id = auth.uid() OR is_team_member(team_id, auth.uid()))
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium users can view their teams"
ON public.teams
FOR SELECT
USING (
  (owner_id = auth.uid() OR id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can view team prompts"
ON public.prompts
FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can view team skills"
ON public.skills
FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can view team workflows"
ON public.workflows
FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can view team collections"
ON public.collections
FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

-- Update other team policies (create, update, delete) to check premium
DROP POLICY IF EXISTS "Team members can create team prompts" ON public.prompts;
DROP POLICY IF EXISTS "Team members can update team prompts" ON public.prompts;
DROP POLICY IF EXISTS "Team members can delete team prompts" ON public.prompts;

CREATE POLICY "Premium team members can create team prompts"
ON public.prompts
FOR INSERT
WITH CHECK (
  (team_id IS NULL OR (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()) AND public.is_premium_user(auth.uid())))
);

CREATE POLICY "Premium team members can update team prompts"
ON public.prompts
FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can delete team prompts"
ON public.prompts
FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

-- Same for skills
DROP POLICY IF EXISTS "Team members can create team skills" ON public.skills;
DROP POLICY IF EXISTS "Team members can update team skills" ON public.skills;
DROP POLICY IF EXISTS "Team members can delete team skills" ON public.skills;

CREATE POLICY "Premium team members can create team skills"
ON public.skills
FOR INSERT
WITH CHECK (
  (team_id IS NULL OR (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()) AND public.is_premium_user(auth.uid())))
);

CREATE POLICY "Premium team members can update team skills"
ON public.skills
FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can delete team skills"
ON public.skills
FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

-- Same for workflows
DROP POLICY IF EXISTS "Team members can create team workflows" ON public.workflows;
DROP POLICY IF EXISTS "Team members can update team workflows" ON public.workflows;
DROP POLICY IF EXISTS "Team members can delete team workflows" ON public.workflows;

CREATE POLICY "Premium team members can create team workflows"
ON public.workflows
FOR INSERT
WITH CHECK (
  (team_id IS NULL OR (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()) AND public.is_premium_user(auth.uid())))
);

CREATE POLICY "Premium team members can update team workflows"
ON public.workflows
FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can delete team workflows"
ON public.workflows
FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

-- Same for collections
DROP POLICY IF EXISTS "Team members can create team collections" ON public.collections;
DROP POLICY IF EXISTS "Team members can update team collections" ON public.collections;
DROP POLICY IF EXISTS "Team members can delete team collections" ON public.collections;

CREATE POLICY "Premium team members can create team collections"
ON public.collections
FOR INSERT
WITH CHECK (
  (team_id IS NULL OR (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()) AND public.is_premium_user(auth.uid())))
);

CREATE POLICY "Premium team members can update team collections"
ON public.collections
FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);

CREATE POLICY "Premium team members can delete team collections"
ON public.collections
FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  AND public.is_premium_user(auth.uid())
);