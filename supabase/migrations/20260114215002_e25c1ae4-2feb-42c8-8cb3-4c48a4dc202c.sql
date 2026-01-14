-- Add category column to skills table
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS category TEXT;

-- Add category column to workflows table
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS category TEXT;