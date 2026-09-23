-- The smaller database findings the 2026-09-16 audit verified and left open
-- (godspeed decision D-214). Each section says what was wrong.

-- ---------------------------------------------------------------------------
-- A. A renamed skill or workflow keeps its address.
--
-- set_skill_slug and set_workflow_slug regenerated the slug on every title
-- change, so every link to a renamed skill or workflow went to a 404. Prompts
-- and kits only fill an empty slug and keep a redirect table for the explicit
-- slug editor. Skills and workflows have no slug editor, so the slug is now
-- simply kept, which is what set_prompt_slug does.
--
-- The four slug triggers also become SECURITY DEFINER, so that
-- generate_unique_slug can be taken away from the API roles (section I).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_skill_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'skills', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_workflow_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'workflows', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_prompt_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompts', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- B. A slug that is another artifact's redirect cannot be taken by a write.
--
-- update_prompt_slug refuses a slug held in prompt_slug_redirects by another
-- prompt, but the owner can PATCH prompts.slug directly and skip it, taking
-- over every old link to someone else's prompt. Kits had no check at all.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refuse_redirect_slug_takeover()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = ''
     OR (TG_OP = 'UPDATE' AND NEW.slug IS NOT DISTINCT FROM OLD.slug) THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'prompts' THEN
    IF EXISTS (SELECT 1 FROM public.prompt_slug_redirects r
                WHERE r.old_slug = NEW.slug AND r.prompt_id <> NEW.id) THEN
      RAISE EXCEPTION 'The slug "%" still redirects to another prompt', NEW.slug
        USING ERRCODE = 'unique_violation';
    END IF;
  ELSIF TG_TABLE_NAME = 'prompt_kits' THEN
    IF EXISTS (SELECT 1 FROM public.prompt_kit_slug_redirects r
                WHERE r.old_slug = NEW.slug AND r.prompt_kit_id <> NEW.id) THEN
      RAISE EXCEPTION 'The slug "%" still redirects to another prompt kit', NEW.slug
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refuse_redirect_slug_takeover() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS refuse_redirect_slug_takeover ON public.prompts;
CREATE TRIGGER refuse_redirect_slug_takeover
  BEFORE INSERT OR UPDATE OF slug ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.refuse_redirect_slug_takeover();

DROP TRIGGER IF EXISTS refuse_redirect_slug_takeover ON public.prompt_kits;
CREATE TRIGGER refuse_redirect_slug_takeover
  BEFORE INSERT OR UPDATE OF slug ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.refuse_redirect_slug_takeover();

-- ---------------------------------------------------------------------------
-- C. A review stays on the artifact it was written for.
--
-- The four review UPDATE policies had no WITH CHECK, so a review's author
-- could PATCH its item id to a private artifact the INSERT policy would have
-- refused. A policy cannot compare with the old row, so the pin is a trigger,
-- and the policies gain the WITH CHECK they were missing.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refuse_review_retarget()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR (to_jsonb(NEW) ->> TG_ARGV[0]) IS DISTINCT FROM (to_jsonb(OLD) ->> TG_ARGV[0]) THEN
    RAISE EXCEPTION 'A review stays with its author and its artifact'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refuse_review_retarget ON public.prompt_reviews;
CREATE TRIGGER refuse_review_retarget BEFORE UPDATE ON public.prompt_reviews
  FOR EACH ROW EXECUTE FUNCTION public.refuse_review_retarget('prompt_id');
DROP TRIGGER IF EXISTS refuse_review_retarget ON public.skill_reviews;
CREATE TRIGGER refuse_review_retarget BEFORE UPDATE ON public.skill_reviews
  FOR EACH ROW EXECUTE FUNCTION public.refuse_review_retarget('skill_id');
DROP TRIGGER IF EXISTS refuse_review_retarget ON public.workflow_reviews;
CREATE TRIGGER refuse_review_retarget BEFORE UPDATE ON public.workflow_reviews
  FOR EACH ROW EXECUTE FUNCTION public.refuse_review_retarget('workflow_id');
DROP TRIGGER IF EXISTS refuse_review_retarget ON public.prompt_kit_reviews;
CREATE TRIGGER refuse_review_retarget BEFORE UPDATE ON public.prompt_kit_reviews
  FOR EACH ROW EXECUTE FUNCTION public.refuse_review_retarget('prompt_kit_id');

ALTER POLICY "Users can update their own reviews" ON public.prompt_reviews
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update their own skill reviews" ON public.skill_reviews
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update their own workflow reviews" ON public.workflow_reviews
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update their own prompt kit reviews" ON public.prompt_kit_reviews
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- D. A free account cannot redeem a team invite.
--
-- Every team policy requires is_premium_user, so a free user who redeemed an
-- invite became a member who could see nothing, and used a seat doing it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.redeem_team_invite(p_token text)
RETURNS TABLE(team_id uuid, team_name text)
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

  IF NOT public.is_premium_user(v_user) THEN
    RAISE EXCEPTION 'Teams need a Premium account. Contact support@querino.ai to upgrade.';
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

-- ---------------------------------------------------------------------------
-- E. Only a prompt the user can see can be bookmarked.
--
-- The INSERT policy only refused the user's own prompts, so any prompt id,
-- private ones included, could be saved. The subquery runs under the
-- caller's own row-level security, so "exists" means "this user can read it".
-- ---------------------------------------------------------------------------

ALTER POLICY "Users can save prompts they do not own" ON public.user_saved_prompts
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.prompts p
       WHERE p.id = user_saved_prompts.prompt_id
         AND p.author_id IS DISTINCT FROM auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- F. prompt_kits ran its updated_at and slug triggers twice per write.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_prompt_kits_updated_at ON public.prompt_kits;
DROP TRIGGER IF EXISTS trg_set_prompt_kit_slug ON public.prompt_kits;

-- ---------------------------------------------------------------------------
-- G. One rule for deleting an account.
--
--   What the account made or owns goes with it. What records money survives
--   it, without the person.
--
-- So every artifact table cascades from its author (skills and workflows
-- already did; prompts and prompt_kits set NULL and left authorless public
-- pages behind whenever a path other than deleteUserRows removed a profile),
-- teams go with their owner, as they already did, and the LLM ledger keeps
-- its rows with user_id NULL and metadata.account_deleted = true, so the
-- platform's spend history does not shrink when a user leaves. The ledger's
-- admin summary counts those rows as a deleted user's, not as machine calls.
-- ---------------------------------------------------------------------------

ALTER TABLE public.prompts DROP CONSTRAINT prompts_author_id_fkey;
ALTER TABLE public.prompts ADD CONSTRAINT prompts_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.prompt_kits DROP CONSTRAINT prompt_kits_author_id_fkey;
ALTER TABLE public.prompt_kits ADD CONSTRAINT prompt_kits_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.llm_usage_events DROP CONSTRAINT llm_usage_events_user_id_fkey;
ALTER TABLE public.llm_usage_events ADD CONSTRAINT llm_usage_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.detach_llm_usage_ledger(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.llm_usage_events
     SET user_id = NULL,
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('account_deleted', true)
   WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.detach_llm_usage_ledger(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detach_llm_usage_ledger(uuid) TO service_role;

-- The summary also counted a user once per config_source inside a call site,
-- so someone whose calls were served by two config rows was two users. It now
-- returns the distinct count for each level the panel shows.
DROP FUNCTION IF EXISTS public.admin_llm_usage_summary(timestamptz);

CREATE FUNCTION public.admin_llm_usage_summary(p_since timestamptz DEFAULT NULL)
RETURNS TABLE(
  call_site text,
  caller_role text,
  is_machine boolean,
  config_source text,
  calls bigint,
  prompt_tokens bigint,
  completion_tokens bigint,
  credits numeric,
  users bigint,
  site_caller_users bigint,
  caller_users bigint,
  last_call_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH one_role_per_user AS (
    SELECT
      ur.user_id,
      (ARRAY_AGG(ur.role::TEXT ORDER BY CASE ur.role::TEXT
        WHEN 'admin'         THEN 1
        WHEN 'premium'       THEN 2
        WHEN 'premium_gift'  THEN 3
        ELSE 4
      END))[1] AS role
    FROM public.user_roles ur
    GROUP BY ur.user_id
  ),
  events AS (
    SELECT
      COALESCE(e.feature, e.workflow_name, '(unnamed)')   AS call_site,
      r.role                                              AS caller_role,
      (e.user_id IS NULL
        AND NOT coalesce((e.metadata->>'account_deleted')::boolean, false)) AS is_machine,
      e.metadata->>'config_source'                        AS config_source,
      e.user_id,
      e.prompt_tokens,
      e.completion_tokens,
      e.credits_charged,
      e.created_at
    FROM public.llm_usage_events e
    LEFT JOIN one_role_per_user r ON r.user_id = e.user_id
    WHERE p_since IS NULL OR e.created_at >= p_since
  ),
  per_site_caller AS (
    SELECT ev.call_site, ev.caller_role, ev.is_machine,
           COUNT(DISTINCT ev.user_id)::BIGINT AS n
      FROM events ev GROUP BY 1, 2, 3
  ),
  per_caller AS (
    SELECT ev.caller_role, ev.is_machine,
           COUNT(DISTINCT ev.user_id)::BIGINT AS n
      FROM events ev GROUP BY 1, 2
  ),
  grouped AS (
    SELECT
      ev.call_site, ev.caller_role, ev.is_machine, ev.config_source,
      COUNT(*)::BIGINT                              AS calls,
      COALESCE(SUM(ev.prompt_tokens), 0)::BIGINT     AS prompt_tokens,
      COALESCE(SUM(ev.completion_tokens), 0)::BIGINT AS completion_tokens,
      COALESCE(SUM(ev.credits_charged), 0)::NUMERIC  AS credits,
      COUNT(DISTINCT ev.user_id)::BIGINT             AS users,
      MAX(ev.created_at)                             AS last_call_at
    FROM events ev
    GROUP BY 1, 2, 3, 4
  )
  SELECT g.call_site, g.caller_role, g.is_machine, g.config_source,
         g.calls, g.prompt_tokens, g.completion_tokens, g.credits, g.users,
         sc.n AS site_caller_users, c.n AS caller_users, g.last_call_at
    FROM grouped g
    JOIN per_site_caller sc
      ON sc.call_site = g.call_site
     AND sc.caller_role IS NOT DISTINCT FROM g.caller_role
     AND sc.is_machine = g.is_machine
    JOIN per_caller c
      ON c.caller_role IS NOT DISTINCT FROM g.caller_role
     AND c.is_machine = g.is_machine
$$;

REVOKE ALL ON FUNCTION public.admin_llm_usage_summary(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_llm_usage_summary(timestamptz) TO service_role;

-- ---------------------------------------------------------------------------
-- H. The Menerio connection key is encrypted at rest and write-only.
--
-- menerio_api_key was plaintext, and its owner could read it back through the
-- row policy, so anything that could run a query in the owner's session (an
-- XSS, a leaked session token) walked away with a key that writes into their
-- Menerio. It now goes the way the GitHub tokens went in 20260908: a trigger
-- moves the value into Vault and blanks the column, the API roles can write
-- the key but never select it, and the edge functions read it through
-- read_menerio_api_key, which only the service role may call. The display
-- name the settings page used to fetch with the key is stored at connect time.
-- ---------------------------------------------------------------------------

ALTER TABLE public.menerio_integration ALTER COLUMN menerio_api_key DROP NOT NULL;
ALTER TABLE public.menerio_integration ADD COLUMN IF NOT EXISTS menerio_api_key_secret_id uuid;
ALTER TABLE public.menerio_integration ADD COLUMN IF NOT EXISTS menerio_display_name text;

CREATE OR REPLACE FUNCTION public.encrypt_menerio_api_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_secret_id uuid;
BEGIN
  -- Never take a secret id from the client.
  NEW.menerio_api_key_secret_id :=
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.menerio_api_key_secret_id ELSE NULL END;

  IF NEW.menerio_api_key IS NULL OR NEW.menerio_api_key = '' THEN
    NEW.menerio_api_key := NULL;
    RETURN NEW;
  END IF;

  v_secret_id := NEW.menerio_api_key_secret_id;
  IF v_secret_id IS NULL THEN
    v_secret_id := vault.create_secret(
      NEW.menerio_api_key,
      'menerio_integration:' || NEW.id::text,
      'Querino Menerio connection key'
    );
  ELSE
    PERFORM vault.update_secret(v_secret_id, NEW.menerio_api_key);
  END IF;

  NEW.menerio_api_key_secret_id := v_secret_id;
  NEW.menerio_api_key := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_menerio_api_key_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
BEGIN
  IF OLD.menerio_api_key_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = OLD.menerio_api_key_secret_id;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_menerio_api_key() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_menerio_api_key_secret() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS encrypt_menerio_api_key_on_write ON public.menerio_integration;
CREATE TRIGGER encrypt_menerio_api_key_on_write
  BEFORE INSERT OR UPDATE ON public.menerio_integration
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_menerio_api_key();

DROP TRIGGER IF EXISTS delete_menerio_api_key_secret_on_delete ON public.menerio_integration;
CREATE TRIGGER delete_menerio_api_key_secret_on_delete
  AFTER DELETE ON public.menerio_integration
  FOR EACH ROW EXECUTE FUNCTION public.delete_menerio_api_key_secret();

CREATE OR REPLACE FUNCTION public.read_menerio_api_key(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_row public.menerio_integration;
  v_secret text;
BEGIN
  SELECT * INTO v_row FROM public.menerio_integration WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_row.menerio_api_key_secret_id IS NOT NULL THEN
    SELECT s.decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets s
     WHERE s.id = v_row.menerio_api_key_secret_id;
    IF v_secret IS NOT NULL THEN
      RETURN v_secret;
    END IF;
  END IF;
  RETURN v_row.menerio_api_key;
END;
$$;

REVOKE ALL ON FUNCTION public.read_menerio_api_key(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_menerio_api_key(uuid) TO service_role;

-- Existing keys move into Vault now: the trigger does the work on a no-op update.
UPDATE public.menerio_integration
   SET menerio_api_key = menerio_api_key
 WHERE menerio_api_key IS NOT NULL;

-- Column grants: the key and its secret id are never selectable by an API
-- role; the key is writable, the secret id is not.
REVOKE ALL ON public.menerio_integration FROM anon;
REVOKE SELECT, INSERT, UPDATE ON public.menerio_integration FROM authenticated;
GRANT SELECT (id, user_id, menerio_base_url, is_active, auto_sync, sync_artifact_types,
              last_sync_at, created_at, updated_at, menerio_display_name)
  ON public.menerio_integration TO authenticated;
GRANT INSERT (user_id, menerio_api_key, menerio_base_url, is_active, auto_sync,
              sync_artifact_types, menerio_display_name)
  ON public.menerio_integration TO authenticated;
GRANT UPDATE (menerio_api_key, menerio_base_url, is_active, auto_sync,
              sync_artifact_types, last_sync_at, menerio_display_name)
  ON public.menerio_integration TO authenticated;

-- ---------------------------------------------------------------------------
-- I. Two functions the anon key could call.
--
-- generate_unique_slug told any caller whether a slug existed, private
-- artifacts included. Only the slug triggers need it, and they now run as
-- their owner (section A). check_signup_allowed has to stay callable by a
-- logged-out visitor, who is the one signing up, but it handed out the exact
-- account count; a visitor now gets only the yes or no.
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.generate_unique_slug(text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(text, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.check_signup_allowed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT COUNT(*)::integer INTO current_count FROM public.profiles;
  SELECT COALESCE(
    (SELECT value_int FROM public.ai_credit_settings WHERE key = 'max_free_accounts'),
    1000
  ) INTO max_count;

  IF auth.uid() IS NOT NULL AND public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object(
      'allowed', current_count < max_count,
      'current_count', current_count,
      'max_count', max_count
    );
  END IF;

  RETURN jsonb_build_object('allowed', current_count < max_count);
END;
$$;
