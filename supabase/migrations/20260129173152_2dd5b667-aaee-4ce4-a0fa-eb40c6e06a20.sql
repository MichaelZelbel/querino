-- Fix 1: Restrict profiles table visibility to reduce data harvesting risk
-- Remove the overly permissive "Authenticated users can view profiles" policy
-- and add more targeted policies

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a policy for viewing public profile information (for public prompts, skills, workflows authors)
-- Users can see limited profile info when viewing public content
CREATE POLICY "Users can view public profile info for content authors"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can view profiles of authors whose public content they can access
  EXISTS (
    SELECT 1 FROM prompts WHERE prompts.author_id = profiles.id AND prompts.is_public = true
  )
  OR EXISTS (
    SELECT 1 FROM skills WHERE skills.author_id = profiles.id AND skills.published = true
  )
  OR EXISTS (
    SELECT 1 FROM workflows WHERE workflows.author_id = profiles.id AND workflows.published = true
  )
  -- Or team members can see each other's profiles
  OR EXISTS (
    SELECT 1 FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
  )
);

-- Fix 2: Strengthen user_credentials protection against team relationship bypasses
-- Add explicit denial for team-based access (credentials should NEVER be shared via teams)

-- The existing policies already restrict to user_id = auth.uid()
-- But let's add an explicit check that team_id cannot be used to access other users' credentials
-- by ensuring the policy is more restrictive

-- Drop and recreate with explicit team isolation
DROP POLICY IF EXISTS "Users can view their own credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "Users can insert their own credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "Users can delete their own credentials" ON public.user_credentials;

-- Recreate with explicit owner-only access (ignoring team_id for RLS purposes)
CREATE POLICY "Users can only view their own credentials"
ON public.user_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own credentials"
ON public.user_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own credentials"
ON public.user_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own credentials"
ON public.user_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);