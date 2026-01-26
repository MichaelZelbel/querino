-- Allow service role to insert allowance periods (for edge functions)
-- The service role bypasses RLS, but we need an explicit INSERT policy for edge functions that use user context
CREATE POLICY "Service can insert allowance periods"
ON public.ai_allowance_periods
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add a policy for admins to insert (for batch operations)
CREATE POLICY "Admins can insert allowance periods"
ON public.ai_allowance_periods
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));