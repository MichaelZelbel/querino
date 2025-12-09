-- Add short_description and tags columns to prompt_versions for complete version snapshots
ALTER TABLE public.prompt_versions
ADD COLUMN short_description text,
ADD COLUMN tags text[] DEFAULT '{}'::text[];