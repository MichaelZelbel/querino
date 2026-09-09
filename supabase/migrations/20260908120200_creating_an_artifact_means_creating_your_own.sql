-- Finding 3 of the 2026-09-08 audit.
--
-- The five "Premium team members can create team ..." policies were written as
-- WITH CHECK (team_id IS NULL OR <member of that team>). Permissive policies
-- are OR'd together, so a row with team_id NULL passed on that policy alone,
-- whatever author_id said. Any signed-in caller could create a public prompt,
-- skill, workflow, kit or collection under another user's name; the GitHub
-- and Menerio triggers then pushed it into that user's repository and notes.
-- None of the policies named a role, so they applied to anon too.
--
-- The matching "update your own" policies had no WITH CHECK, so an author could
-- move their own artifact into any team by id.
--
-- Now each INSERT policy requires the row to be the caller's own, and the team
-- branch additionally requires membership. Both are for authenticated only.

-- prompts
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Premium team members can create team prompts" ON public.prompts;
CREATE POLICY "Users can create their own prompts" ON public.prompts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND team_id IS NULL);
CREATE POLICY "Premium team members can create team prompts" ON public.prompts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Users can update their own prompts" ON public.prompts
  WITH CHECK (
    auth.uid() = author_id
    AND (team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
  );

-- skills
DROP POLICY IF EXISTS "Users can create their own skills" ON public.skills;
DROP POLICY IF EXISTS "Premium team members can create team skills" ON public.skills;
CREATE POLICY "Users can create their own skills" ON public.skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND team_id IS NULL);
CREATE POLICY "Premium team members can create team skills" ON public.skills
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Users can update their own skills" ON public.skills
  WITH CHECK (
    auth.uid() = author_id
    AND (team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
  );

-- workflows
DROP POLICY IF EXISTS "Users can create their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Premium team members can create team workflows" ON public.workflows;
CREATE POLICY "Users can create their own workflows" ON public.workflows
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND team_id IS NULL);
CREATE POLICY "Premium team members can create team workflows" ON public.workflows
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Users can update their own workflows" ON public.workflows
  WITH CHECK (
    auth.uid() = author_id
    AND (team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
  );

-- prompt kits
DROP POLICY IF EXISTS "Users can create their own prompt kits" ON public.prompt_kits;
DROP POLICY IF EXISTS "Premium team members can create team prompt kits" ON public.prompt_kits;
CREATE POLICY "Users can create their own prompt kits" ON public.prompt_kits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND team_id IS NULL);
CREATE POLICY "Premium team members can create team prompt kits" ON public.prompt_kits
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Users can update their own prompt kits" ON public.prompt_kits
  WITH CHECK (
    auth.uid() = author_id
    AND (team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
  );

-- collections (owned through owner_id)
DROP POLICY IF EXISTS "Users can create their own collections" ON public.collections;
DROP POLICY IF EXISTS "Premium team members can create team collections" ON public.collections;
CREATE POLICY "Users can create their own collections" ON public.collections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND team_id IS NULL);
CREATE POLICY "Premium team members can create team collections" ON public.collections
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Users can update their own collections" ON public.collections
  WITH CHECK (
    auth.uid() = owner_id
    AND (team_id IS NULL OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
  );
