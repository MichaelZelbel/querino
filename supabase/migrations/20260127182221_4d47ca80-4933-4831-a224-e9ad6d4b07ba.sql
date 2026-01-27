-- Add UPDATE policy for admins on ai_credit_settings table
CREATE POLICY "Admins can update AI credit settings"
ON public.ai_credit_settings
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));