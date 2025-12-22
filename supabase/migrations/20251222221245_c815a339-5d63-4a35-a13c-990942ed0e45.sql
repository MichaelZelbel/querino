-- First drop the functions that reference short_description in their return type
DROP FUNCTION IF EXISTS public.search_prompts_semantic(vector, double precision, integer);
DROP FUNCTION IF EXISTS public.get_similar_prompts(uuid, integer);

-- Rename short_description to description in prompts table
ALTER TABLE public.prompts RENAME COLUMN short_description TO description;

-- Also update prompt_versions table for consistency
ALTER TABLE public.prompt_versions RENAME COLUMN short_description TO description;

-- Recreate the search_prompts_semantic function with new column name
CREATE OR REPLACE FUNCTION public.search_prompts_semantic(query_embedding vector, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, title text, description text, content text, category text, tags text[], rating_avg numeric, rating_count integer, copies_count integer, is_public boolean, author_id uuid, created_at timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.content,
    p.category,
    p.tags,
    p.rating_avg,
    p.rating_count,
    p.copies_count,
    p.is_public,
    p.author_id,
    p.created_at,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM public.prompts p
  WHERE p.is_public = true
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Recreate the get_similar_prompts function with new column name
CREATE OR REPLACE FUNCTION public.get_similar_prompts(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, category text, rating_avg numeric, rating_count integer, copies_count integer, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
BEGIN
  SELECT p.embedding INTO target_embedding
  FROM public.prompts p
  WHERE p.id = target_id;

  IF target_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.category,
    p.rating_avg,
    p.rating_count,
    p.copies_count,
    p.author_id,
    p.team_id,
    p.tags,
    1 - (p.embedding <=> target_embedding) as similarity
  FROM public.prompts p
  WHERE p.id != target_id
    AND p.is_public = true
    AND p.embedding IS NOT NULL
  ORDER BY p.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;