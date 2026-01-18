-- Add GitHub token and last synced timestamp to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS github_token_encrypted text,
ADD COLUMN IF NOT EXISTS github_last_synced_at timestamp with time zone;

-- Add GitHub token and last synced timestamp to teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS github_token_encrypted text,
ADD COLUMN IF NOT EXISTS github_last_synced_at timestamp with time zone;