
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
  
  -- Normalize known Latin accented characters to ASCII equivalents
  result := translate(result,
    'àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķĸĺļľŀłńņňŉŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżž',
    'aaaaaaaceeeeiiiidnoooooouuuuyyaaaccccddeeeeegggghhiiiiiiijkklllllnnnnnoooorrrsssssttttuuuuuuwyzzzz'
  );
  
  -- Replace whitespace with hyphens
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  
  -- Remove ASCII punctuation/symbols unsafe in URLs
  result := REGEXP_REPLACE(result, '[!@#$%^&*()+=\[\]{};:''",.<>?/\\|`~]', '', 'g');
  
  -- Remove emoji and other symbol Unicode blocks (common ranges)
  -- Emoticons, Symbols, Dingbats, Transport/Map symbols, Misc symbols
  result := REGEXP_REPLACE(result, E'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002600-\U000027BF\U00002700-\U000027BF\U0000FE00-\U0000FE0F\U0000200D]', '', 'g');
  
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
