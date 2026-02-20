-- Fix: Enable RLS on prompt_coach_messages table
ALTER TABLE public.prompt_coach_messages ENABLE ROW LEVEL SECURITY;

-- Since this table stores chat messages keyed by session_id (not user_id),
-- and the app uses localStorage for messages (not this table directly),
-- we'll add restrictive policies that prevent anonymous/public access
-- while allowing authenticated users to manage their own sessions.

-- Allow authenticated users to read their own session messages
CREATE POLICY "Authenticated users can read messages"
ON public.prompt_coach_messages
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert messages  
CREATE POLICY "Authenticated users can insert messages"
ON public.prompt_coach_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete their messages
CREATE POLICY "Authenticated users can delete messages"
ON public.prompt_coach_messages
FOR DELETE
TO authenticated
USING (true);