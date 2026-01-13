-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can save prompts" ON public.user_saved_prompts;

-- Create new INSERT policy that prevents saving own prompts
CREATE POLICY "Users can save prompts they do not own" 
ON public.user_saved_prompts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.prompts 
    WHERE prompts.id = prompt_id 
    AND prompts.author_id = auth.uid()
  )
);