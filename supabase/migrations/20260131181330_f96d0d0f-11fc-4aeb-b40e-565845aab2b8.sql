-- COMPLETE MIGRATION: Create user_roles architecture

-- Step 1: Create enum type
CREATE TYPE public.app_role AS ENUM ('free', 'premium', 'premium_gift', 'admin');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security-definer functions FIRST (before dropping old ones)
-- Use different names temporarily to avoid conflicts

CREATE FUNCTION public.get_user_role(_user_id UUID) RETURNS app_role
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
  $$;

CREATE FUNCTION public.is_admin_v2(_user_id UUID) RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
  $$;

CREATE FUNCTION public.has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  $$;

CREATE FUNCTION public.is_premium_user_v2(_user_id UUID) RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id 
      AND role IN ('premium', 'premium_gift', 'admin')
    )
  $$;

-- Step 4: Auto-assign 'free' on signup
CREATE FUNCTION public.handle_new_user_role() RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END;
  $$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Step 5: Migrate existing data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id,
  CASE
    WHEN role = 'admin' THEN 'admin'::app_role
    WHEN plan_type = 'premium' THEN 'premium'::app_role
    ELSE 'free'::app_role
  END
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Drop dependent policies that use old is_admin
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update allowance periods" ON public.ai_allowance_periods;
DROP POLICY IF EXISTS "Admins can insert allowance periods" ON public.ai_allowance_periods;
DROP POLICY IF EXISTS "Admins can view all allowance periods" ON public.ai_allowance_periods;
DROP POLICY IF EXISTS "Admins can update AI credit settings" ON public.ai_credit_settings;

-- Step 7: Drop dependent policies that use old is_premium_user
DROP POLICY IF EXISTS "Premium team members can create team collections" ON public.collections;
DROP POLICY IF EXISTS "Premium team members can delete team collections" ON public.collections;
DROP POLICY IF EXISTS "Premium team members can update team collections" ON public.collections;
DROP POLICY IF EXISTS "Premium team members can view team collections" ON public.collections;
DROP POLICY IF EXISTS "Premium team members can create team prompts" ON public.prompts;
DROP POLICY IF EXISTS "Premium team members can delete team prompts" ON public.prompts;
DROP POLICY IF EXISTS "Premium team members can update team prompts" ON public.prompts;
DROP POLICY IF EXISTS "Premium team members can view team prompts" ON public.prompts;
DROP POLICY IF EXISTS "Premium team members can create team skills" ON public.skills;
DROP POLICY IF EXISTS "Premium team members can delete team skills" ON public.skills;
DROP POLICY IF EXISTS "Premium team members can update team skills" ON public.skills;
DROP POLICY IF EXISTS "Premium team members can view team skills" ON public.skills;
DROP POLICY IF EXISTS "Premium team members can create team workflows" ON public.workflows;
DROP POLICY IF EXISTS "Premium team members can delete team workflows" ON public.workflows;
DROP POLICY IF EXISTS "Premium team members can update team workflows" ON public.workflows;
DROP POLICY IF EXISTS "Premium team members can view team workflows" ON public.workflows;
DROP POLICY IF EXISTS "Only premium users can add premium members" ON public.team_members;
DROP POLICY IF EXISTS "Premium team members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Premium users can join teams as members" ON public.team_members;
DROP POLICY IF EXISTS "Only premium users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Premium users can view teams to join" ON public.teams;
DROP POLICY IF EXISTS "Premium users can view their teams" ON public.teams;

-- Step 8: Drop old functions
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_premium_user(uuid);

-- Step 9: Rename new functions to standard names
ALTER FUNCTION public.is_admin_v2(uuid) RENAME TO is_admin;
ALTER FUNCTION public.is_premium_user_v2(uuid) RENAME TO is_premium_user;

-- Step 10: RLS policies for user_roles table
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (is_admin(auth.uid()));

-- Step 11: Recreate dropped policies using new functions
-- Profiles policies
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin(auth.uid()));

-- AI allowance periods policies
CREATE POLICY "Admins can update allowance periods" ON public.ai_allowance_periods FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can insert allowance periods" ON public.ai_allowance_periods FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view all allowance periods" ON public.ai_allowance_periods FOR SELECT USING (is_admin(auth.uid()));

-- AI credit settings policies
CREATE POLICY "Admins can update AI credit settings" ON public.ai_credit_settings FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Collections policies
CREATE POLICY "Premium team members can create team collections" ON public.collections FOR INSERT WITH CHECK ((team_id IS NULL) OR ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid())));
CREATE POLICY "Premium team members can delete team collections" ON public.collections FOR DELETE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can update team collections" ON public.collections FOR UPDATE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can view team collections" ON public.collections FOR SELECT USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));

-- Prompts policies
CREATE POLICY "Premium team members can create team prompts" ON public.prompts FOR INSERT WITH CHECK ((team_id IS NULL) OR ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid())));
CREATE POLICY "Premium team members can delete team prompts" ON public.prompts FOR DELETE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can update team prompts" ON public.prompts FOR UPDATE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can view team prompts" ON public.prompts FOR SELECT USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));

-- Skills policies
CREATE POLICY "Premium team members can create team skills" ON public.skills FOR INSERT WITH CHECK ((team_id IS NULL) OR ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid())));
CREATE POLICY "Premium team members can delete team skills" ON public.skills FOR DELETE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can update team skills" ON public.skills FOR UPDATE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can view team skills" ON public.skills FOR SELECT USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));

-- Workflows policies
CREATE POLICY "Premium team members can create team workflows" ON public.workflows FOR INSERT WITH CHECK ((team_id IS NULL) OR ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid())));
CREATE POLICY "Premium team members can delete team workflows" ON public.workflows FOR DELETE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can update team workflows" ON public.workflows FOR UPDATE USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium team members can view team workflows" ON public.workflows FOR SELECT USING ((team_id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid())) AND is_premium_user(auth.uid()));

-- Team members policies
CREATE POLICY "Only premium users can add premium members" ON public.team_members FOR INSERT WITH CHECK (is_premium_user(auth.uid()) AND is_premium_user(user_id) AND ((EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())) OR (EXISTS (SELECT 1 FROM team_members existing WHERE existing.team_id = team_members.team_id AND existing.user_id = auth.uid() AND existing.role = ANY (ARRAY['owner'::text, 'admin'::text])))));
CREATE POLICY "Premium team members can view team members" ON public.team_members FOR SELECT USING (((user_id = auth.uid()) OR is_team_member(team_id, auth.uid())) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium users can join teams as members" ON public.team_members FOR INSERT WITH CHECK ((auth.uid() = user_id) AND (role = 'member'::text) AND is_premium_user(auth.uid()) AND (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id)));

-- Teams policies
CREATE POLICY "Only premium users can create teams" ON public.teams FOR INSERT WITH CHECK ((auth.uid() = owner_id) AND is_premium_user(auth.uid()));
CREATE POLICY "Premium users can view teams to join" ON public.teams FOR SELECT USING (is_premium_user(auth.uid()));
CREATE POLICY "Premium users can view their teams" ON public.teams FOR SELECT USING (((owner_id = auth.uid()) OR (id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid()))) AND is_premium_user(auth.uid()));