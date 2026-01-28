-- Allow premium users to view any team so they can join it
-- This is needed because the current SELECT policy only lets users see teams they already belong to
CREATE POLICY "Premium users can view teams to join" 
ON public.teams 
FOR SELECT 
USING (is_premium_user(auth.uid()));