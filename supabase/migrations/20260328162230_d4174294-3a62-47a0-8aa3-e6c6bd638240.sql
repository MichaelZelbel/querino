
-- Create menerio_sync_queue table
CREATE TABLE public.menerio_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_type text NOT NULL,
  artifact_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.menerio_sync_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access (implicit)
-- Users can read their own queue entries
CREATE POLICY "Users can view own sync queue"
  ON public.menerio_sync_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role insert policy
CREATE POLICY "Service role full access"
  ON public.menerio_sync_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow triggers (which run as table owner) to insert
-- We need a security definer function for the trigger
CREATE OR REPLACE FUNCTION public.queue_menerio_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_artifact_type text;
  v_user_id uuid;
  v_artifact_id uuid;
BEGIN
  -- Determine artifact type from table name
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

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.menerio_synced = true AND OLD.author_id IS NOT NULL THEN
      -- Deduplicate: remove pending entries for same artifact
      DELETE FROM public.menerio_sync_queue
      WHERE artifact_type = v_artifact_type
        AND artifact_id = OLD.id
        AND status IN ('pending', 'delete_pending');

      INSERT INTO public.menerio_sync_queue (user_id, artifact_type, artifact_id, status)
      VALUES (OLD.author_id, v_artifact_type, OLD.id, 'delete_pending');
    END IF;
    RETURN OLD;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Only queue if already synced
    IF OLD.menerio_synced = true AND NEW.author_id IS NOT NULL THEN
      -- Check if relevant fields changed
      IF OLD.title IS DISTINCT FROM NEW.title
        OR OLD.description IS DISTINCT FROM NEW.description
        OR OLD.content IS DISTINCT FROM NEW.content
        OR OLD.category IS DISTINCT FROM NEW.category
        OR OLD.tags IS DISTINCT FROM NEW.tags
      THEN
        -- Deduplicate
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
$$;

-- Create triggers on all four tables

-- Prompts UPDATE
CREATE TRIGGER queue_menerio_sync_on_prompts_update
  AFTER UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Prompts DELETE
CREATE TRIGGER queue_menerio_sync_on_prompts_delete
  AFTER DELETE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Skills UPDATE
CREATE TRIGGER queue_menerio_sync_on_skills_update
  AFTER UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Skills DELETE
CREATE TRIGGER queue_menerio_sync_on_skills_delete
  AFTER DELETE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Claws UPDATE
CREATE TRIGGER queue_menerio_sync_on_claws_update
  AFTER UPDATE ON public.claws
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Claws DELETE
CREATE TRIGGER queue_menerio_sync_on_claws_delete
  AFTER DELETE ON public.claws
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Workflows UPDATE
CREATE TRIGGER queue_menerio_sync_on_workflows_update
  AFTER UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();

-- Workflows DELETE
CREATE TRIGGER queue_menerio_sync_on_workflows_delete
  AFTER DELETE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_menerio_sync();
