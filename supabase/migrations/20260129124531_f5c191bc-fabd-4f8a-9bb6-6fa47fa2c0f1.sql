-- Create user_credentials table for storing sensitive credentials like GitHub tokens
-- This table has strict RLS - only the owner can access their own credentials

CREATE TABLE public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_type text NOT NULL,
  credential_value text NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, credential_type, team_id)
);

-- Enable RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies - ONLY the owner can access their own credentials
-- No public access whatsoever

CREATE POLICY "Users can view their own credentials"
ON public.user_credentials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
ON public.user_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
ON public.user_credentials
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
ON public.user_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_credentials_updated_at
BEFORE UPDATE ON public.user_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing personal GitHub tokens from profiles table
INSERT INTO public.user_credentials (user_id, credential_type, credential_value, team_id)
SELECT 
  id as user_id,
  'github_token' as credential_type,
  github_token_encrypted as credential_value,
  NULL as team_id
FROM public.profiles
WHERE github_token_encrypted IS NOT NULL AND github_token_encrypted != '';

-- Migrate existing team GitHub tokens from teams table
-- Team tokens are stored with the team owner as the user_id for RLS purposes
INSERT INTO public.user_credentials (user_id, credential_type, credential_value, team_id)
SELECT 
  owner_id as user_id,
  'github_token' as credential_type,
  github_token_encrypted as credential_value,
  id as team_id
FROM public.teams
WHERE github_token_encrypted IS NOT NULL AND github_token_encrypted != '';

-- Drop the exposed columns from profiles and teams
ALTER TABLE public.profiles DROP COLUMN IF EXISTS github_token_encrypted;
ALTER TABLE public.teams DROP COLUMN IF EXISTS github_token_encrypted;