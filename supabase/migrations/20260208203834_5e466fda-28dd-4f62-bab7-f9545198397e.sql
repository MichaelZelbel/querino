-- Create claw_pins table for pinning Claws
CREATE TABLE public.claw_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claw_id UUID NOT NULL REFERENCES public.claws(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, claw_id)
);

-- Enable RLS
ALTER TABLE public.claw_pins ENABLE ROW LEVEL SECURITY;

-- Policies for claw_pins
CREATE POLICY "Users can view their own pins" 
ON public.claw_pins FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pins" 
ON public.claw_pins FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins" 
ON public.claw_pins FOR DELETE 
USING (auth.uid() = user_id);

-- Create claw_versions table for version history
CREATE TABLE public.claw_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claw_id UUID NOT NULL REFERENCES public.claws(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  skill_md_content TEXT,
  tags TEXT[],
  change_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(claw_id, version_number)
);

-- Enable RLS
ALTER TABLE public.claw_versions ENABLE ROW LEVEL SECURITY;

-- Policies for claw_versions
CREATE POLICY "Anyone can view versions of public claws"
ON public.claw_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.claws 
    WHERE claws.id = claw_versions.claw_id 
    AND claws.published = true
  )
);

CREATE POLICY "Authors can view their own claw versions"
ON public.claw_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.claws 
    WHERE claws.id = claw_versions.claw_id 
    AND claws.author_id = auth.uid()
  )
);

CREATE POLICY "Authors can create versions for their claws"
ON public.claw_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.claws 
    WHERE claws.id = claw_versions.claw_id 
    AND claws.author_id = auth.uid()
  )
);

-- Index for faster version lookups
CREATE INDEX idx_claw_versions_claw_id ON public.claw_versions(claw_id);
CREATE INDEX idx_claw_pins_user_id ON public.claw_pins(user_id);