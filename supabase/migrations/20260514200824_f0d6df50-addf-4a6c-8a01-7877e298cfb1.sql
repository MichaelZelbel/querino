-- Erweitere queue_menerio_sync(): unterstützt INSERT, respektiert auto_sync und sync_artifact_types
CREATE OR REPLACE FUNCTION public.queue_menerio_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_artifact_type text;
  v_integration record;
  v_should_queue boolean := false;
BEGIN
  -- Artefakt-Typ aus Tabellenname ableiten
  IF TG_TABLE_NAME = 'prompts' THEN
    v_artifact_type := 'prompt';
  ELSIF TG_TABLE_NAME = 'skills' THEN
    v_artifact_type := 'skill';
  ELSIF TG_TABLE_NAME = 'claws' THEN
    v_artifact_type := 'claw';
  ELSIF TG_TABLE_NAME = 'workflows' THEN
    v_artifact_type := 'workflow';
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- DELETE: nur wenn vorher gesynct
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

  -- INSERT / UPDATE: Integration + Auto-Sync prüfen
  IF NEW.author_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_active, auto_sync, sync_artifact_types
    INTO v_integration
    FROM public.menerio_integration
   WHERE user_id = NEW.author_id
   LIMIT 1;

  IF NOT FOUND
     OR v_integration.is_active IS NOT TRUE
     OR v_integration.auto_sync IS NOT TRUE
     OR NOT (v_artifact_type = ANY(v_integration.sync_artifact_types)) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_queue := true;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Bei Updates: nur wenn relevante Felder sich geändert haben
    IF OLD.title IS DISTINCT FROM NEW.title
       OR OLD.description IS DISTINCT FROM NEW.description
       OR OLD.content IS DISTINCT FROM NEW.content
       OR OLD.category IS DISTINCT FROM NEW.category
       OR OLD.tags IS DISTINCT FROM NEW.tags
    THEN
      v_should_queue := true;
    END IF;
  END IF;

  IF v_should_queue THEN
    DELETE FROM public.menerio_sync_queue
    WHERE artifact_type = v_artifact_type
      AND artifact_id = NEW.id
      AND status = 'pending';

    INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
    VALUES (NEW.author_id, v_artifact_type, NEW.id, 'pending');
  END IF;

  RETURN NEW;
END;
$$;

-- INSERT-Trigger für die drei aktiven Artefakt-Typen
DROP TRIGGER IF EXISTS queue_menerio_sync_on_prompts_insert ON public.prompts;
CREATE TRIGGER queue_menerio_sync_on_prompts_insert
  AFTER INSERT ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

DROP TRIGGER IF EXISTS queue_menerio_sync_on_skills_insert ON public.skills;
CREATE TRIGGER queue_menerio_sync_on_skills_insert
  AFTER INSERT ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

DROP TRIGGER IF EXISTS queue_menerio_sync_on_workflows_insert ON public.workflows;
CREATE TRIGGER queue_menerio_sync_on_workflows_insert
  AFTER INSERT ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Backfill: alle noch nicht gesyncten Artefakte aktiver User einreihen
INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
SELECT p.author_id, 'prompt', p.id, 'pending'
FROM public.prompts p
JOIN public.menerio_integration mi ON mi.user_id = p.author_id
WHERE mi.is_active = true
  AND mi.auto_sync = true
  AND 'prompt' = ANY(mi.sync_artifact_types)
  AND p.menerio_synced = false
  AND p.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.menerio_sync_queue q
    WHERE q.artifact_type = 'prompt' AND q.artifact_id = p.id AND q.status = 'pending'
  );

INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
SELECT s.author_id, 'skill', s.id, 'pending'
FROM public.skills s
JOIN public.menerio_integration mi ON mi.user_id = s.author_id
WHERE mi.is_active = true
  AND mi.auto_sync = true
  AND 'skill' = ANY(mi.sync_artifact_types)
  AND s.menerio_synced = false
  AND s.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.menerio_sync_queue q
    WHERE q.artifact_type = 'skill' AND q.artifact_id = s.id AND q.status = 'pending'
  );

INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
SELECT w.author_id, 'workflow', w.id, 'pending'
FROM public.workflows w
JOIN public.menerio_integration mi ON mi.user_id = w.author_id
WHERE mi.is_active = true
  AND mi.auto_sync = true
  AND 'workflow' = ANY(mi.sync_artifact_types)
  AND w.menerio_synced = false
  AND w.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.menerio_sync_queue q
    WHERE q.artifact_type = 'workflow' AND q.artifact_id = w.id AND q.status = 'pending'
  );