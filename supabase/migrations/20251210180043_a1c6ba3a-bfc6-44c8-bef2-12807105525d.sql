-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  github_repo text,
  github_branch text DEFAULT 'main',
  github_folder text,
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('owner', 'admin', 'member')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Add team_id to prompts
ALTER TABLE public.prompts ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to skills
ALTER TABLE public.skills ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to workflows
ALTER TABLE public.workflows ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to collections
ALTER TABLE public.collections ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Teams RLS policies
CREATE POLICY "Users can view teams they belong to"
ON public.teams FOR SELECT
USING (
  id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams"
ON public.teams FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
ON public.teams FOR DELETE
USING (owner_id = auth.uid());

-- Team members RLS policies
CREATE POLICY "Team members can view their team's members"
ON public.team_members FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team owners and admins can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR 
  team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
);

CREATE POLICY "Team owners and admins can update members"
ON public.team_members FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team owners and admins can remove members"
ON public.team_members FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Update prompts RLS to include team access
CREATE POLICY "Team members can view team prompts"
ON public.prompts FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can create team prompts"
ON public.prompts FOR INSERT
WITH CHECK (
  team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can update team prompts"
ON public.prompts FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can delete team prompts"
ON public.prompts FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

-- Update skills RLS to include team access
CREATE POLICY "Team members can view team skills"
ON public.skills FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can create team skills"
ON public.skills FOR INSERT
WITH CHECK (
  team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can update team skills"
ON public.skills FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can delete team skills"
ON public.skills FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

-- Update workflows RLS to include team access
CREATE POLICY "Team members can view team workflows"
ON public.workflows FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can create team workflows"
ON public.workflows FOR INSERT
WITH CHECK (
  team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can update team workflows"
ON public.workflows FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can delete team workflows"
ON public.workflows FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

-- Update collections RLS to include team access
CREATE POLICY "Team members can view team collections"
ON public.collections FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can create team collections"
ON public.collections FOR INSERT
WITH CHECK (
  team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can update team collections"
ON public.collections FOR UPDATE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team members can delete team collections"
ON public.collections FOR DELETE
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);