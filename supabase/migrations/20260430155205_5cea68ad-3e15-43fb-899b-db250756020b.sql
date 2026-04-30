
-- Drop claw-specific tables (CASCADE removes triggers, indexes, FKs)
DROP TABLE IF EXISTS public.claw_pins CASCADE;
DROP TABLE IF EXISTS public.claw_reviews CASCADE;
DROP TABLE IF EXISTS public.claw_versions CASCADE;
DROP TABLE IF EXISTS public.claws CASCADE;

-- Drop claw-only functions
DROP FUNCTION IF EXISTS public.set_claw_slug() CASCADE;
DROP FUNCTION IF EXISTS public.get_similar_claws(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.search_claws_semantic(vector, double precision, integer) CASCADE;

-- Update polymorphic helpers to drop the 'claw' branch
CREATE OR REPLACE FUNCTION public.is_item_public(p_item_type text, p_item_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND is_public = true);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND published = true);
  ELSE
    RETURN false;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_item_owner(p_item_type text, p_item_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND author_id = p_user_id);
  ELSE
    RETURN false;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_team_member_for_item(p_item_type text, p_item_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_team_id UUID;
BEGIN
  IF p_item_type = 'prompt' THEN
    SELECT team_id INTO v_team_id FROM prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT team_id INTO v_team_id FROM skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT team_id INTO v_team_id FROM workflows WHERE id = p_item_id;
  ELSE
    RETURN false;
  END IF;

  IF v_team_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (SELECT 1 FROM team_members WHERE team_id = v_team_id AND user_id = p_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_embedding(p_item_type text, p_item_id uuid, p_embedding vector)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

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

CREATE OR REPLACE FUNCTION public.queue_menerio_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_artifact_type text;
BEGIN
  IF TG_TABLE_NAME = 'prompts' THEN
    v_artifact_type := 'prompt';
  ELSIF TG_TABLE_NAME = 'skills' THEN
    v_artifact_type := 'skill';
  ELSIF TG_TABLE_NAME = 'workflows' THEN
    v_artifact_type := 'workflow';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.menerio_synced = true AND OLD.author_id IS NOT NULL THEN
      DELETE FROM public.menerio_sync_queue
      WHERE artifact_type = v_artifact_type
        AND artifact_id = OLD.id
        AND status IN ('pending', 'delete_pending');

      INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
      VALUES (OLD.author_id, v_artifact_type, OLD.id, 'delete_pending');
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.menerio_synced = true AND NEW.author_id IS NOT NULL THEN
      IF OLD.title IS DISTINCT FROM NEW.title
        OR OLD.description IS DISTINCT FROM NEW.description
        OR OLD.content IS DISTINCT FROM NEW.content
        OR OLD.category IS DISTINCT FROM NEW.category
        OR OLD.tags IS DISTINCT FROM NEW.tags
      THEN
        DELETE FROM public.menerio_sync_queue
        WHERE artifact_type = v_artifact_type
          AND artifact_id = NEW.id
          AND status = 'pending';

        INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
        VALUES (NEW.author_id, v_artifact_type, NEW.id, 'pending');
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update menerio integration default + existing rows
ALTER TABLE public.menerio_integration
  ALTER COLUMN sync_artifact_types SET DEFAULT ARRAY['prompt','skill','workflow']::text[];

UPDATE public.menerio_integration
  SET sync_artifact_types = array_remove(sync_artifact_types, 'claw')
  WHERE 'claw' = ANY(sync_artifact_types);

-- Clean up any leftover sync queue entries for claws
DELETE FROM public.menerio_sync_queue WHERE artifact_type = 'claw';

-- Clean up activity_events / collection_items / ai_insights / comments / suggestions / moderation rows referencing claws
DELETE FROM public.activity_events WHERE item_type = 'claw';
DELETE FROM public.collection_items WHERE item_type = 'claw';
DELETE FROM public.ai_insights WHERE item_type = 'claw';
DELETE FROM public.comments WHERE item_type = 'claw';
DELETE FROM public.suggestions WHERE item_type = 'claw';
DELETE FROM public.moderation_events WHERE item_type = 'claw';
DELETE FROM public.moderation_review_queue WHERE item_type = 'claw';
