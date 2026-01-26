-- Add RLS policy for admins to SELECT all allowance periods
CREATE POLICY "Admins can view all allowance periods"
ON public.ai_allowance_periods
FOR SELECT
USING (is_admin(auth.uid()));