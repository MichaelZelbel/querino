
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
  
  -- Normalize known Latin accented characters
  result := translate(result,
    'àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķĸĺļľŀłńņňŉŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżž',
    'aaaaaaaceeeeiiiidnoooooouuuuyyaaaccccddeeeeegggghhiiiiiiijkklllllnnnnnoooorrrsssssttttuuuuuuwyzzzz'
  );
  
  -- Replace whitespace with hyphens
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  
  -- Remove only ASCII non-word characters that aren't hyphens
  -- This keeps ALL non-ASCII chars (Devanagari, Arabic, Chinese, etc.) intact
  -- while removing ASCII punctuation like !@#$%^&*()
  result := REGEXP_REPLACE(result, '[^\w\x80-\xFF\-]', '', 'g');
  
  -- Replace underscores with hyphens
  result := REPLACE(result, '_', '-');
  
  -- Collapse multiple hyphens
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  -- Trim leading/trailing hyphens
  result := TRIM(BOTH '-' FROM result);
  
  -- Fallback if empty
  IF result IS NULL OR result = '' THEN
    result := 'untitled-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
  END IF;
  
  RETURN result;
END;
$function$;
