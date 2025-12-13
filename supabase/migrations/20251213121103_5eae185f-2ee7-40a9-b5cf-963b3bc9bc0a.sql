-- Create RPC function for similar prompts
CREATE OR REPLACE FUNCTION public.get_similar_prompts(
  target_id uuid,
  match_limit integer DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  title text,
  short_description text,
  category text,
  rating_avg numeric,
  rating_count integer,
  copies_count integer,
  author_id uuid,
  team_id uuid,
  tags text[],
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_embedding vector(1536);
BEGIN
  -- Get the embedding of the target prompt
  SELECT p.embedding INTO target_embedding
  FROM public.prompts p
  WHERE p.id = target_id;

  -- If no embedding, return empty
  IF target_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Return similar prompts
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.short_description,
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
$$;

-- Create RPC function for similar skills
CREATE OR REPLACE FUNCTION public.get_similar_skills(
  target_id uuid,
  match_limit integer DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  author_id uuid,
  team_id uuid,
  tags text[],
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_embedding vector(1536);
BEGIN
  -- Get the embedding of the target skill
  SELECT s.embedding INTO target_embedding
  FROM public.skills s
  WHERE s.id = target_id;

  -- If no embedding, return empty
  IF target_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Return similar skills
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.author_id,
    s.team_id,
    s.tags,
    1 - (s.embedding <=> target_embedding) as similarity
  FROM public.skills s
  WHERE s.id != target_id
    AND s.published = true
    AND s.embedding IS NOT NULL
  ORDER BY s.embedding <=> target_embedding
  LIMIT match_limit;
END;
$$;

-- Create RPC function for similar workflows
CREATE OR REPLACE FUNCTION public.get_similar_workflows(
  target_id uuid,
  match_limit integer DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  author_id uuid,
  team_id uuid,
  tags text[],
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_embedding vector(1536);
BEGIN
  -- Get the embedding of the target workflow
  SELECT w.embedding INTO target_embedding
  FROM public.workflows w
  WHERE w.id = target_id;

  -- If no embedding, return empty
  IF target_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Return similar workflows
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.description,
    w.author_id,
    w.team_id,
    w.tags,
    1 - (w.embedding <=> target_embedding) as similarity
  FROM public.workflows w
  WHERE w.id != target_id
    AND w.published = true
    AND w.embedding IS NOT NULL
  ORDER BY w.embedding <=> target_embedding
  LIMIT match_limit;
END;
$$;