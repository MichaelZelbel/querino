-- Allow premium users to join a team by adding themselves as a 'member'
CREATE POLICY "Premium users can join teams as members"
ON public.team_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'member'
  AND is_premium_user(auth.uid())
  AND EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id)
);