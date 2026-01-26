-- Allow admins to update ai_allowance_periods
CREATE POLICY "Admins can update allowance periods"
ON public.ai_allowance_periods
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));