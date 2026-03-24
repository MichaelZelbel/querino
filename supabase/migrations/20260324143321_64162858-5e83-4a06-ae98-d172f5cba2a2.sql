
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result TEXT;
BEGIN
  -- 1. Trim and lowercase
  result := LOWER(TRIM(title));
  
  -- 2. Normalize Unicode to NFD (decomposed form) so accented chars split into base + combining mark
  result := normalize(result, NFD);
  
  -- 3. Remove combining diacritical marks (U+0300 to U+036F)
  --    This converts é→e, ñ→n, ü→u, etc. while keeping non-Latin scripts intact
  result := REGEXP_REPLACE(result, '[\u0300-\u036F]', '', 'g');
  
  -- 4. Re-compose back to NFC for clean storage
  result := normalize(result, NFC);
  
  -- 5. Replace whitespace sequences with a single hyphen
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  
  -- 6. Remove characters that are NOT Unicode letters, digits, underscores, or hyphens
  result := REGEXP_REPLACE(result, '[^\w\-]', '', 'g');
  
  -- 7. Replace underscores with hyphens
  result := REPLACE(result, '_', '-');
  
  -- 8. Collapse multiple hyphens
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  -- 9. Trim leading/trailing hyphens
  result := TRIM(BOTH '-' FROM result);
  
  -- 10. Fallback if empty
  IF result IS NULL OR result = '' THEN
    result := 'untitled-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
  END IF;
  
  RETURN result;
END;
$function$;
