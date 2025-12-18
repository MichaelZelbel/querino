-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = 'admin'
  )
$$;

-- Allow admins to update any profile's role, plan_type, and plan_source
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
);

-- Allow admins to view all profiles (they need this to see the user list)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.is_admin(auth.uid())
);