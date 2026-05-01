-- =========================================================
-- GitHub Auto-Sync: Queue + State + Triggers
-- =========================================================

-- ---------- Queue table ----------
CREATE TABLE IF NOT EXISTS public.github_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_type text NOT NULL CHECK (artifact_type IN ('prompt','skill','workflow','prompt_kit')),
  artifact_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('upsert','delete')),
  owner_user_id uuid,           -- author_id of the artifact
  team_id uuid,                 -- if artifact belongs to a team
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed','skipped')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_github_sync_queue_status_created
  ON public.github_sync_queue (status, created_at);

CREATE INDEX IF NOT EXISTS idx_github_sync_queue_artifact
  ON public.github_sync_queue (artifact_type, artifact_id);

CREATE INDEX IF NOT EXISTS idx_github_sync_queue_owner
  ON public.github_sync_queue (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_github_sync_queue_team
  ON public.github_sync_queue (team_id);

ALTER TABLE public.github_sync_queue ENABLE ROW LEVEL SECURITY;

-- Owners can see their own queue entries
CREATE POLICY "Users can view their own sync queue entries"
  ON public.github_sync_queue
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Team members can see team queue entries
CREATE POLICY "Team members can view team sync queue entries"
  ON public.github_sync_queue
  FOR SELECT
  TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

-- ---------- State table ----------
CREATE TABLE IF NOT EXISTS public.github_sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_type text NOT NULL CHECK (artifact_type IN ('prompt','skill','workflow','prompt_kit')),
  artifact_id uuid NOT NULL,
  target_scope text NOT NULL CHECK (target_scope IN ('user','team')),
  target_id uuid NOT NULL,           -- user_id or team_id whose repo holds the file
  repo text NOT NULL,
  branch text NOT NULL,
  path text NOT NULL,
  sha text,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artifact_type, artifact_id, target_scope, target_id)
);

CREATE INDEX IF NOT EXISTS idx_github_sync_state_artifact
  ON public.github_sync_state (artifact_type, artifact_id);

ALTER TABLE public.github_sync_state ENABLE ROW LEVEL SECURITY;

-- No client policies => only service_role can access (which bypasses RLS).

-- ---------- updated_at triggers ----------
CREATE TRIGGER trg_github_sync_queue_updated_at
  BEFORE UPDATE ON public.github_sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_github_sync_state_updated_at
  BEFORE UPDATE ON public.github_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Enqueue helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.enqueue_github_sync(
  p_artifact_type text,
  p_artifact_id uuid,
  p_operation text,
  p_owner_user_id uuid,
  p_team_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.github_sync_queue (
    artifact_type, artifact_id, operation, owner_user_id, team_id, payload
  ) VALUES (
    p_artifact_type, p_artifact_id, p_operation, p_owner_user_id, p_team_id, COALESCE(p_payload, '{}'::jsonb)
  );
END;
$$;

-- =========================================================
-- Trigger functions per artifact
-- (only enqueue on content-relevant changes; ignore stats updates)
-- =========================================================

-- ----- prompts -----
CREATE OR REPLACE FUNCTION public.tg_github_sync_prompts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('prompt', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.is_public IS DISTINCT FROM OLD.is_public)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync('prompt', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('prompt', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_github_sync_prompts ON public.prompts;
CREATE TRIGGER trg_github_sync_prompts
  AFTER INSERT OR UPDATE OR DELETE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.tg_github_sync_prompts();

-- ----- skills -----
CREATE OR REPLACE FUNCTION public.tg_github_sync_skills()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('skill', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.published IS DISTINCT FROM OLD.published)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync('skill', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('skill', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_github_sync_skills ON public.skills;
CREATE TRIGGER trg_github_sync_skills
  AFTER INSERT OR UPDATE OR DELETE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.tg_github_sync_skills();

-- ----- workflows -----
CREATE OR REPLACE FUNCTION public.tg_github_sync_workflows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('workflow', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.published IS DISTINCT FROM OLD.published)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync('workflow', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('workflow', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_github_sync_workflows ON public.workflows;
CREATE TRIGGER trg_github_sync_workflows
  AFTER INSERT OR UPDATE OR DELETE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.tg_github_sync_workflows();

-- ----- prompt_kits -----
CREATE OR REPLACE FUNCTION public.tg_github_sync_prompt_kits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_github_sync('prompt_kit', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.slug IS DISTINCT FROM OLD.slug)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.content IS DISTINCT FROM OLD.content)
       OR (NEW.category IS DISTINCT FROM OLD.category)
       OR (NEW.tags IS DISTINCT FROM OLD.tags)
       OR (NEW.language IS DISTINCT FROM OLD.language)
       OR (NEW.published IS DISTINCT FROM OLD.published)
       OR (NEW.team_id IS DISTINCT FROM OLD.team_id)
       OR (NEW.author_id IS DISTINCT FROM OLD.author_id)
    THEN
      PERFORM public.enqueue_github_sync('prompt_kit', NEW.id, 'upsert', NEW.author_id, NEW.team_id, '{}'::jsonb);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object('slug', OLD.slug, 'title', OLD.title);
    PERFORM public.enqueue_github_sync('prompt_kit', OLD.id, 'delete', OLD.author_id, OLD.team_id, v_payload);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_github_sync_prompt_kits ON public.prompt_kits;
CREATE TRIGGER trg_github_sync_prompt_kits
  AFTER INSERT OR UPDATE OR DELETE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.tg_github_sync_prompt_kits();