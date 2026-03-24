
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
  
  -- 2. Normalize known Latin accented characters via translate()
  result := translate(result,
    'àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķĸĺļľŀłńņňŉŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżž',
    'aaaaaaaceeeeiiiidnoooooouuuuyyaaaccccddeeeeegggghhiiiiiiijkklllllnnnnnoooorrrsssssttttuuuuuuwyzzzz'
  );
  
  -- 3. Replace whitespace sequences with a single hyphen
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  
  -- 4. Keep Unicode letters (\w), hyphens, AND Unicode combining marks (U+0900-U+097F Devanagari,
  --    U+0600-U+06FF Arabic, U+0980-U+09FF Bengali, U+0A00-U+0A7F Gurmukhi, etc.)
  --    Broad approach: keep all chars with code point > 127 (non-ASCII) plus \w and hyphens
  --    This preserves all non-Latin scripts intact.
  result := REGEXP_REPLACE(result, '[^\w\x80-\x{10FFFF}\-]', '', 'g');
  
  -- 5. Replace underscores with hyphens
  result := REPLACE(result, '_', '-');
  
  -- 6. Collapse multiple hyphens
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  -- 7. Trim leading/trailing hyphens
  result := TRIM(BOTH '-' FROM result);
  
  -- 8. Fallback if empty
  IF result IS NULL OR result = '' THEN
    result := 'untitled-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
  END IF;
  
  RETURN result;
END;
$function$;
