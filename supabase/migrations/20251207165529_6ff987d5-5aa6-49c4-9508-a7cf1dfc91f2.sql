-- Add new columns for publishing workflow
ALTER TABLE public.prompts
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS example_output TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.prompts.published_at IS 'Timestamp when the prompt was first published publicly';
COMMENT ON COLUMN public.prompts.summary IS 'Short 1-2 sentence explanation for discovery pages';
COMMENT ON COLUMN public.prompts.example_output IS 'Optional example of what the prompt produces';