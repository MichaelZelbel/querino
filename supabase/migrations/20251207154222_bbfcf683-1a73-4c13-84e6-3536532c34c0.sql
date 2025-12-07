-- Create prompt_versions table for version history
CREATE TABLE public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  change_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, version_number)
);

-- Enable RLS
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view versions of their own prompts
CREATE POLICY "Users can view versions of their own prompts"
ON public.prompt_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND prompts.author_id = auth.uid()
  )
);

-- RLS: Users can insert versions for their own prompts
CREATE POLICY "Users can insert versions for their own prompts"
ON public.prompt_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND prompts.author_id = auth.uid()
  )
);

-- RLS: Users can delete versions of their own prompts
CREATE POLICY "Users can delete versions of their own prompts"
ON public.prompt_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_versions.prompt_id
    AND prompts.author_id = auth.uid()
  )
);

-- Add updated_at column to prompts table if not exists
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to update updated_at on prompts
CREATE OR REPLACE FUNCTION public.update_prompts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prompts_updated_at();