
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result TEXT;
BEGIN
  result := LOWER(TRIM(title));
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  result := REGEXP_REPLACE(result, '[^\w\-]', '', 'g');
  result := REPLACE(result, '_', '-');
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  result := TRIM(BOTH '-' FROM result);
  IF result IS NULL OR result = '' THEN
    result := 'untitled-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
  END IF;
  RETURN result;
END;
$function$;
