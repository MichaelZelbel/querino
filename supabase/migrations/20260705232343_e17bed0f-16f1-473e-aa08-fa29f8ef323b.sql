
-- =========================================================================
-- 1. Fix signup notification trigger auth via Vault
-- =========================================================================

-- Store service_role_key in Vault (idempotent). Value must be updated by the
-- project owner after migration runs — see notice at end of file.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'service_role_key') THEN
    PERFORM vault.create_secret('REPLACE_WITH_SERVICE_ROLE_KEY', 'service_role_key');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  v_service_key TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF v_service_key IS NULL OR v_service_key = '' OR v_service_key = 'REPLACE_WITH_SERVICE_ROLE_KEY' THEN
    RAISE WARNING 'notify_admin_on_signup: service_role_key vault secret not configured';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'eventType', 'signup',
      'userEmail', user_email,
      'userId', NEW.id::text,
      'displayName', COALESCE(NEW.display_name, 'Unknown')
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send signup notification: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- =========================================================================
-- 2. skill_versions + workflow_versions (mirror prompt_versions)
-- =========================================================================

CREATE TABLE public.skill_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(skill_id, version_number)
);

GRANT SELECT, INSERT, DELETE ON public.skill_versions TO authenticated;
GRANT ALL ON public.skill_versions TO service_role;

ALTER TABLE public.skill_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_skill_versions_skill_id ON public.skill_versions(skill_id);

CREATE POLICY "Users can view versions of their own skills"
  ON public.skill_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.skills WHERE skills.id = skill_versions.skill_id AND skills.author_id = auth.uid()));

CREATE POLICY "Users can insert versions for their own skills"
  ON public.skill_versions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.skills WHERE skills.id = skill_versions.skill_id AND skills.author_id = auth.uid()));

CREATE POLICY "Users can delete versions of their own skills"
  ON public.skill_versions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.skills WHERE skills.id = skill_versions.skill_id AND skills.author_id = auth.uid()));

CREATE TABLE public.workflow_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, version_number)
);

GRANT SELECT, INSERT, DELETE ON public.workflow_versions TO authenticated;
GRANT ALL ON public.workflow_versions TO service_role;

ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_workflow_versions_workflow_id ON public.workflow_versions(workflow_id);

CREATE POLICY "Users can view versions of their own workflows"
  ON public.workflow_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workflows WHERE workflows.id = workflow_versions.workflow_id AND workflows.author_id = auth.uid()));

CREATE POLICY "Users can insert versions for their own workflows"
  ON public.workflow_versions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows WHERE workflows.id = workflow_versions.workflow_id AND workflows.author_id = auth.uid()));

CREATE POLICY "Users can delete versions of their own workflows"
  ON public.workflow_versions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.workflows WHERE workflows.id = workflow_versions.workflow_id AND workflows.author_id = auth.uid()));

-- =========================================================================
-- 3. team_invites + redeem_team_invite RPC
-- =========================================================================

CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64'),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '14 days',
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX idx_team_invites_token ON public.team_invites(token);

CREATE POLICY "Team owners/admins can view invites"
  ON public.team_invites FOR SELECT
  USING (public.is_team_admin_or_owner(team_id, auth.uid()));

CREATE POLICY "Team owners/admins can create invites"
  ON public.team_invites FOR INSERT
  WITH CHECK (public.is_team_admin_or_owner(team_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Team owners/admins can delete invites"
  ON public.team_invites FOR DELETE
  USING (public.is_team_admin_or_owner(team_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.redeem_team_invite(p_token TEXT)
RETURNS TABLE (team_id UUID, team_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.team_invites WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = v_invite.team_id AND user_id = v_user) THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_invite.team_id, v_user, v_invite.role);

    UPDATE public.team_invites SET used_count = used_count + 1 WHERE id = v_invite.id;
  END IF;

  RETURN QUERY
  SELECT t.id, t.name FROM public.teams t WHERE t.id = v_invite.team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_team_invite(TEXT) TO authenticated;
