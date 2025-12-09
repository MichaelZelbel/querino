-- Add GitHub sync fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN github_repo TEXT,
ADD COLUMN github_branch TEXT DEFAULT 'main',
ADD COLUMN github_folder TEXT,
ADD COLUMN github_sync_enabled BOOLEAN DEFAULT FALSE;