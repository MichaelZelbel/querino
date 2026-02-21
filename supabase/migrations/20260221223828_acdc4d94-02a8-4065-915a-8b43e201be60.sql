
-- New setting
INSERT INTO ai_credit_settings (key, value_int, description)
VALUES ('max_free_accounts', 1000, 'Maximum number of free accounts allowed before signups are closed');

-- RPC function
CREATE OR REPLACE FUNCTION public.check_signup_allowed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT COUNT(*)::integer INTO current_count FROM public.profiles;
  SELECT COALESCE(
    (SELECT value_int FROM public.ai_credit_settings WHERE key = 'max_free_accounts'),
    1000
  ) INTO max_count;
  
  RETURN jsonb_build_object(
    'allowed', current_count < max_count,
    'current_count', current_count,
    'max_count', max_count
  );
END;
$$;
