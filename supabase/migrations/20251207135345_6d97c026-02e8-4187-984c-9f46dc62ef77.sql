-- Create user_saved_prompts table
CREATE TABLE public.user_saved_prompts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, prompt_id)
);

-- Enable RLS
ALTER TABLE public.user_saved_prompts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own saved prompts
CREATE POLICY "Users can save prompts"
ON public.user_saved_prompts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own saved prompts
CREATE POLICY "Users can view their saved prompts"
ON public.user_saved_prompts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own saved prompts
CREATE POLICY "Users can unsave prompts"
ON public.user_saved_prompts
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_saved_prompts_user_id ON public.user_saved_prompts(user_id);
CREATE INDEX idx_user_saved_prompts_prompt_id ON public.user_saved_prompts(prompt_id);