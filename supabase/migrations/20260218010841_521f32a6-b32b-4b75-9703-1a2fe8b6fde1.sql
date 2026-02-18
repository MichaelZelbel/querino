
-- Create a public_profiles view that exposes only safe, non-sensitive fields
-- This prevents role/plan_type/plan_source from ever being returned in public queries
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on)
AS
SELECT
  id,
  display_name,
  avatar_url,
  bio,
  website,
  twitter,
  github,
  created_at
FROM public.profiles;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;
