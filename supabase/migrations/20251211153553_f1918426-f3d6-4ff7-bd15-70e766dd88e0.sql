-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to artefact tables
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS prompts_embedding_idx ON public.prompts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS skills_embedding_idx ON public.skills USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS workflows_embedding_idx ON public.workflows USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create RPC function to update embeddings safely
CREATE OR REPLACE FUNCTION public.update_embedding(
  p_item_type text,
  p_item_id uuid,
  p_embedding vector(1536)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_item_type = 'prompt' THEN
    UPDATE public.prompts SET embedding = p_embedding WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    UPDATE public.skills SET embedding = p_embedding WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    UPDATE public.workflows SET embedding = p_embedding WHERE id = p_item_id;
  ELSE
    RAISE EXCEPTION 'Invalid item_type: %', p_item_type;
  END IF;
END;
$$;

-- Create RPC function for semantic search on prompts
CREATE OR REPLACE FUNCTION public.search_prompts_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  short_description text,
  content text,
  category text,
  tags text[],
  rating_avg numeric,
  rating_count integer,
  copies_count integer,
  is_public boolean,
  author_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.short_description,
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
$$;

-- Create RPC function for semantic search on skills
CREATE OR REPLACE FUNCTION public.search_skills_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  content text,
  tags text[],
  author_id uuid,
  published boolean,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.content,
    s.tags,
    s.author_id,
    s.published,
    s.created_at,
    1 - (s.embedding <=> query_embedding) as similarity
  FROM public.skills s
  WHERE s.published = true
    AND s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create RPC function for semantic search on workflows
CREATE OR REPLACE FUNCTION public.search_workflows_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  workflow_json jsonb,
  tags text[],
  author_id uuid,
  published boolean,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.description,
    w.json as workflow_json,
    w.tags,
    w.author_id,
    w.published,
    w.created_at,
    1 - (w.embedding <=> query_embedding) as similarity
  FROM public.workflows w
  WHERE w.published = true
    AND w.embedding IS NOT NULL
    AND 1 - (w.embedding <=> query_embedding) > match_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;