-- Create RPC function to get active creators in the last 7 days
CREATE OR REPLACE FUNCTION public.active_creators_last_7_days()
RETURNS integer AS $$
  SELECT COALESCE(COUNT(DISTINCT author_id)::integer, 0)
  FROM prompts
  WHERE updated_at > now() - interval '7 days';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;