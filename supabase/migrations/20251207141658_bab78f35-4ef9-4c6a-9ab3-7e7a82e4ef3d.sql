-- Add author_id column to prompts table (nullable for existing/seed prompts)
ALTER TABLE public.prompts ADD COLUMN author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON public.prompts;

-- Create new RLS policies

-- Anyone can read public prompts
CREATE POLICY "Public prompts are viewable by everyone"
ON public.prompts
FOR SELECT
USING (is_public = true);

-- Owners can read their own prompts (including private ones)
CREATE POLICY "Users can view their own prompts"
ON public.prompts
FOR SELECT
USING (auth.uid() = author_id);

-- Only authenticated users can insert their own prompts
CREATE POLICY "Users can create their own prompts"
ON public.prompts
FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Only the author can update their own prompts
CREATE POLICY "Users can update their own prompts"
ON public.prompts
FOR UPDATE
USING (auth.uid() = author_id);

-- Only the author can delete their own prompts
CREATE POLICY "Users can delete their own prompts"
ON public.prompts
FOR DELETE
USING (auth.uid() = author_id);

-- Create index for faster author lookups
CREATE INDEX idx_prompts_author_id ON public.prompts(author_id);