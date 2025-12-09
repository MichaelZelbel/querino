-- Create prompt_pins table for user favorites
CREATE TABLE public.prompt_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, prompt_id)
);

-- Enable Row Level Security
ALTER TABLE public.prompt_pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pins"
ON public.prompt_pins
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pins"
ON public.prompt_pins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins"
ON public.prompt_pins
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_prompt_pins_user_id ON public.prompt_pins(user_id);
CREATE INDEX idx_prompt_pins_prompt_id ON public.prompt_pins(prompt_id);