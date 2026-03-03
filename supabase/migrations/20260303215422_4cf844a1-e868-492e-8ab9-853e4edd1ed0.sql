CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_title text, p_table text, p_exclude_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  base_slug := public.generate_slug(p_title);
  new_slug := base_slug;
  
  LOOP
    IF p_table = 'prompts' THEN
      SELECT EXISTS(SELECT 1 FROM public.prompts WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'skills' THEN
      SELECT EXISTS(SELECT 1 FROM public.skills WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'workflows' THEN
      SELECT EXISTS(SELECT 1 FROM public.workflows WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'claws' THEN
      SELECT EXISTS(SELECT 1 FROM public.claws WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSE
      slug_exists := FALSE;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$function$;