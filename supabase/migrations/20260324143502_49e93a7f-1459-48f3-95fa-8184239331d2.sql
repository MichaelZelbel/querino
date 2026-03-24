
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result TEXT;
  decomposed TEXT;
  has_latin BOOLEAN;
BEGIN
  -- 1. Trim and lowercase
  result := LOWER(TRIM(title));
  
  -- 2. Check if the title contains Latin characters
  has_latin := result ~ '[a-zA-Zà-öø-ÿĀ-žƀ-ɏ]';
  
  -- 3. Only strip diacritics from Latin characters
  --    We do NFD decomposition, but only remove combining marks that follow Latin base chars
  IF has_latin THEN
    -- NFD decompose, remove combining diacritical marks (U+0300-U+036F) only
    -- But we need to be selective: only remove them when they follow Latin letters
    -- Simpler approach: process char-by-char via translate for known accented chars
    -- Actually, use a targeted approach: decompose, then remove combining marks
    -- that appear after Latin base characters.
    -- Safest: use translate() for known Latin diacritics
    result := translate(result,
      'àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķĸĺļľŀłńņňŉŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżž',
      'aaaaaaaceeeeiiiidnoooooouuuuyyaaaccccddeeeeegggghhiiiiiiijkklllllnnnnnoooorrrsssssttttuuuuuuwyzzzz'
    );
  END IF;
  
  -- 4. Replace whitespace sequences with a single hyphen
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  
  -- 5. Remove characters that are NOT Unicode letters, digits, underscores, or hyphens
  result := REGEXP_REPLACE(result, '[^\w\-]', '', 'g');
  
  -- 6. Replace underscores with hyphens
  result := REPLACE(result, '_', '-');
  
  -- 7. Collapse multiple hyphens
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  -- 8. Trim leading/trailing hyphens
  result := TRIM(BOTH '-' FROM result);
  
  -- 9. Fallback if empty
  IF result IS NULL OR result = '' THEN
    result := 'untitled-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
  END IF;
  
  RETURN result;
END;
$function$;
