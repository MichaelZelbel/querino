-- Similar items on a public page are public, unowned items only.
--
-- The detail pages now show similar items to visitors and free users. The site's
-- public listings leave out team items (published AND team_id IS NULL, see
-- src/lib/publicArtifacts.ts), but these four functions only checked the
-- published flag. Each now returns nothing for a team-owned target and never
-- lists a team-owned row. Return shapes are unchanged, and CREATE OR REPLACE
-- keeps the existing grants (anon may call them); no table is created, so no
-- grant is stated here.

CREATE OR REPLACE FUNCTION public.get_similar_prompts(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, category text, rating_avg numeric, rating_count integer, copies_count integer, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
  target_public boolean;
  target_team uuid;
BEGIN
  SELECT p.embedding, p.is_public, p.team_id INTO target_embedding, target_public, target_team
  FROM public.prompts p
  WHERE p.id = target_id;

  IF target_embedding IS NULL OR target_public IS NOT TRUE OR target_team IS NOT NULL THEN
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
    AND p.team_id IS NULL
    AND p.embedding IS NOT NULL
  ORDER BY p.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_similar_skills(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
  target_published boolean;
  target_team uuid;
BEGIN
  SELECT s.embedding, s.published, s.team_id INTO target_embedding, target_published, target_team
  FROM public.skills s
  WHERE s.id = target_id;

  IF target_embedding IS NULL OR target_published IS NOT TRUE OR target_team IS NOT NULL THEN
    RETURN;
  END IF;

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
    AND s.team_id IS NULL
    AND s.embedding IS NOT NULL
  ORDER BY s.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_similar_workflows(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
  target_published boolean;
  target_team uuid;
BEGIN
  SELECT w.embedding, w.published, w.team_id INTO target_embedding, target_published, target_team
  FROM public.workflows w
  WHERE w.id = target_id;

  IF target_embedding IS NULL OR target_published IS NOT TRUE OR target_team IS NOT NULL THEN
    RETURN;
  END IF;

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
    AND w.team_id IS NULL
    AND w.embedding IS NOT NULL
  ORDER BY w.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_similar_prompt_kits(target_id uuid, match_limit integer DEFAULT 6)
 RETURNS TABLE(id uuid, title text, description text, author_id uuid, team_id uuid, tags text[], similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_embedding vector(1536);
  target_published boolean;
  target_team uuid;
BEGIN
  SELECT pk.embedding, pk.published, pk.team_id INTO target_embedding, target_published, target_team
  FROM public.prompt_kits pk
  WHERE pk.id = target_id;

  IF target_embedding IS NULL OR target_published IS NOT TRUE OR target_team IS NOT NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pk.id, pk.title, pk.description, pk.author_id, pk.team_id, pk.tags,
         1 - (pk.embedding <=> target_embedding) AS similarity
  FROM public.prompt_kits pk
  WHERE pk.id != target_id
    AND pk.published = true
    AND pk.team_id IS NULL
    AND pk.embedding IS NOT NULL
  ORDER BY pk.embedding <=> target_embedding
  LIMIT match_limit;
END;
$function$;

-- Every visitor may call these: the detail pages ask them with the anon key.
GRANT EXECUTE ON FUNCTION public.get_similar_prompts(uuid, integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_similar_skills(uuid, integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_similar_workflows(uuid, integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_similar_prompt_kits(uuid, integer) TO PUBLIC;
