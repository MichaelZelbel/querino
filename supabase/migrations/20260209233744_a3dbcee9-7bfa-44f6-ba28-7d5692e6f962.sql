
-- Add language column to prompts, skills, workflows, claws
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE public.claws ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

-- Backfill existing records (default handles this, but be explicit)
UPDATE public.prompts SET language = 'en' WHERE language IS NULL;
UPDATE public.skills SET language = 'en' WHERE language IS NULL;
UPDATE public.workflows SET language = 'en' WHERE language IS NULL;
UPDATE public.claws SET language = 'en' WHERE language IS NULL;
