-- The 2026-09-16 audit read all 145 migrations as one effective schema and
-- checked every finding against the live database before this file was
-- written. Everything below was verified there first: zero orphan kit
-- versions, zero duplicate version numbers, zero kits pointing at a deleted
-- team, zero duplicate display names, zero duplicate credential rows, and the
-- four expression indexes at zero scans since the last statistics reset.
-- Postgres is 17.6, so UNIQUE NULLS NOT DISTINCT is available.
--
-- In order:
--   1. Signup no longer fails when the derived display name already exists.
--   2. A personal token saved a second time replaces the first one.
--   3. Comments, collections and activity accept prompt kits.
--   4. The owner of a private artifact can read the insights they paid for.
--   5. Kit versions and kit teams get the foreign keys every sibling has.
--   6. Nobody but an admin can change who owns an artifact.
--   7. A team admin cannot insert an undeletable owner seat.
--   8. Activity rows cannot be injected into a stranger's team feed.
--   9. A team owner cannot hand the team to an unconsenting person.
--  10. The usage ledger accepts machine rows (moderation, embeddings).
--  11. Two ownership predicates learn the anonymous-role guard.
--  12. The five role predicates survive an empty claims setting.
--  13. Two REVOKEs that did nothing are written so that they do.
--  14. Fourteen redundant indexes are dropped on a disk-IO-budgeted Micro.

-- 1. handle_new_user has no ON CONFLICT and no collision handling, and since
--    20260908231000 profiles carries a case-insensitive unique index on
--    display_name. The second Google user called "John Smith", or the second
--    michael@ at any domain, raised 23505 inside the auth trigger, which rolled
--    back the auth.users insert and made GoTrue answer "Database error saving
--    new user". The name now gets a numeric suffix until it is free.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base text;
  v_candidate text;
  v_n integer := 0;
BEGIN
  v_base := NULLIF(trim(COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    SPLIT_PART(NEW.email, '@', 1)
  )), '');
  IF v_base IS NULL THEN
    v_base := 'user';
  END IF;

  v_candidate := v_base;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(display_name) = lower(v_candidate)
  ) LOOP
    v_n := v_n + 1;
    v_candidate := v_base || '-' || v_n;
  END LOOP;

  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    v_candidate,
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. UNIQUE (user_id, credential_type, team_id) treats two NULL team_ids as
--    different rows, so the Settings page's upsert with team_id = null never
--    conflicted and every save of a personal GitHub token added a row. The
--    reader picked one of them with no ORDER BY, so a rotated token could keep
--    the revoked one in use. No duplicate exists today; the DELETE is there so
--    the constraint can never fail to attach on a database that has some.
DELETE FROM public.user_credentials c
 USING public.user_credentials newer
 WHERE c.team_id IS NULL
   AND newer.team_id IS NULL
   AND newer.user_id = c.user_id
   AND newer.credential_type = c.credential_type
   AND newer.updated_at > c.updated_at;

ALTER TABLE public.user_credentials
  DROP CONSTRAINT IF EXISTS user_credentials_user_id_credential_type_team_id_key;
ALTER TABLE public.user_credentials
  ADD CONSTRAINT user_credentials_user_id_credential_type_team_id_key
  UNIQUE NULLS NOT DISTINCT (user_id, credential_type, team_id);

-- The personal branch gets the same "newest row wins" the team branch got on
-- 2026-09-08. The body is the live one restated in full, that ORDER BY added.
CREATE OR REPLACE FUNCTION public.read_user_credential(
  _credential_type text,
  _user_id uuid DEFAULT NULL::uuid,
  _team_id uuid DEFAULT NULL::uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_row public.user_credentials;
  v_secret text;
BEGIN
  IF _team_id IS NOT NULL THEN
    -- The team's own owner first, then the most recently written row, so two
    -- admins each holding a token cannot make this answer differ per call.
    SELECT * INTO v_row
      FROM public.user_credentials c
     WHERE c.credential_type = _credential_type
       AND c.team_id = _team_id
     ORDER BY (c.user_id = (SELECT t.owner_id FROM public.teams t WHERE t.id = _team_id)) DESC,
              c.updated_at DESC
     LIMIT 1;
  ELSE
    IF _user_id IS NULL THEN
      RAISE EXCEPTION 'read_user_credential needs a user id or a team id'
        USING ERRCODE = 'null_value_not_allowed';
    END IF;
    SELECT * INTO v_row
      FROM public.user_credentials c
     WHERE c.credential_type = _credential_type
       AND c.user_id = _user_id
       AND c.team_id IS NULL
     ORDER BY c.updated_at DESC
     LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_row.credential_secret_id IS NOT NULL THEN
    SELECT s.decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets s
     WHERE s.id = v_row.credential_secret_id;
    IF v_secret IS NOT NULL THEN
      RETURN v_secret;
    END IF;
  END IF;

  RETURN v_row.credential_value;
END;
$$;

-- 3. suggestions and ai_insights were widened for prompt kits in April; these
--    three were missed, so every kit comment, every "add kit to collection"
--    and every activity row for a kit failed with 23514.
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_item_type_check;
ALTER TABLE public.comments ADD CONSTRAINT comments_item_type_check
  CHECK (item_type IN ('prompt', 'skill', 'workflow', 'collection', 'prompt_kit'));

ALTER TABLE public.collection_items DROP CONSTRAINT IF EXISTS collection_items_item_type_check;
ALTER TABLE public.collection_items ADD CONSTRAINT collection_items_item_type_check
  CHECK (item_type IN ('prompt', 'skill', 'workflow', 'prompt_kit'));

ALTER TABLE public.activity_events DROP CONSTRAINT IF EXISTS activity_events_item_type_check;
ALTER TABLE public.activity_events ADD CONSTRAINT activity_events_item_type_check
  CHECK (item_type IN ('prompt', 'skill', 'workflow', 'collection', 'profile', 'team', 'prompt_kit'));

-- 4. ai_insights has SELECT policies for public items and team items and none
--    for the owner. The owner of a private, non-team artifact paid credits for
--    insights, the upsert's RETURNING failed against RLS, and every later visit
--    found nothing cached.
DROP POLICY IF EXISTS "Owners can view insights for their items" ON public.ai_insights;
CREATE POLICY "Owners can view insights for their items"
  ON public.ai_insights
  FOR SELECT
  TO authenticated
  USING (public.is_item_owner(item_type, item_id, auth.uid()));

-- 5. prompt_kit_versions had no foreign key and no uniqueness on the version
--    number, and prompt_kits.team_id had no foreign key at all. Every sibling
--    table has both.
ALTER TABLE public.prompt_kit_versions
  DROP CONSTRAINT IF EXISTS prompt_kit_versions_prompt_kit_id_fkey;
ALTER TABLE public.prompt_kit_versions
  ADD CONSTRAINT prompt_kit_versions_prompt_kit_id_fkey
  FOREIGN KEY (prompt_kit_id) REFERENCES public.prompt_kits(id) ON DELETE CASCADE;
ALTER TABLE public.prompt_kit_versions
  DROP CONSTRAINT IF EXISTS prompt_kit_versions_prompt_kit_id_version_number_key;
ALTER TABLE public.prompt_kit_versions
  ADD CONSTRAINT prompt_kit_versions_prompt_kit_id_version_number_key
  UNIQUE (prompt_kit_id, version_number);

UPDATE public.prompt_kits k
   SET team_id = NULL
 WHERE k.team_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.teams t WHERE t.id = k.team_id);
ALTER TABLE public.prompt_kits
  DROP CONSTRAINT IF EXISTS prompt_kits_team_id_fkey;
ALTER TABLE public.prompt_kits
  ADD CONSTRAINT prompt_kits_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- 6. The five "Premium team members can update team ..." policies have no
--    WITH CHECK, so the USING clause is reused and it says nothing about
--    author_id. Any premium team member could write any author_id on a team
--    artifact, including a victim's, which fires the GitHub and Menerio sync
--    triggers into that person's repository and notes. The INSERT half of this
--    was closed on 2026-09-08; this is the UPDATE half. No app flow changes an
--    author (grep of src/ and the edge functions, 2026-09-16), so the trigger
--    refuses it for everyone except an admin and the service role.
CREATE OR REPLACE FUNCTION public.refuse_artifact_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old uuid;
  v_new uuid;
BEGIN
  -- The service role, pg_cron and migrations have no auth.uid() and are left
  -- alone, exactly as guard_privileged_profile_columns does it.
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'collections' THEN
    v_old := OLD.owner_id;
    v_new := NEW.owner_id;
  ELSE
    v_old := OLD.author_id;
    v_new := NEW.author_id;
  END IF;

  IF v_new IS DISTINCT FROM v_old THEN
    RAISE EXCEPTION 'the owner of an artifact cannot be changed here'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refuse_owner_change ON public.prompts;
CREATE TRIGGER refuse_owner_change BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.refuse_artifact_owner_change();
DROP TRIGGER IF EXISTS refuse_owner_change ON public.skills;
CREATE TRIGGER refuse_owner_change BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.refuse_artifact_owner_change();
DROP TRIGGER IF EXISTS refuse_owner_change ON public.workflows;
CREATE TRIGGER refuse_owner_change BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.refuse_artifact_owner_change();
DROP TRIGGER IF EXISTS refuse_owner_change ON public.prompt_kits;
CREATE TRIGGER refuse_owner_change BEFORE UPDATE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.refuse_artifact_owner_change();
DROP TRIGGER IF EXISTS refuse_owner_change ON public.collections;
CREATE TRIGGER refuse_owner_change BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.refuse_artifact_owner_change();

-- The same five policies also get the WITH CHECK they lacked, so a team
-- artifact cannot leave the set of teams the writer belongs to. Each is the
-- live USING clause repeated as the check.
ALTER POLICY "Premium team members can update team prompts" ON public.prompts
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Premium team members can update team skills" ON public.skills
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Premium team members can update team workflows" ON public.workflows
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Premium team members can update team prompt kits" ON public.prompt_kits
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );
ALTER POLICY "Premium team members can update team collections" ON public.collections
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND public.is_premium_user(auth.uid())
  );

-- 7. The team_members INSERT policy never constrained role, while UPDATE was
--    restricted to admin/member on 2026-09-08 and DELETE refuses owner rows.
--    A team admin could insert (team, anyone, 'owner'): a seat nobody could
--    ever remove, not even the real owner. The one legitimate owner insert is
--    the creator's own row when the team is created (useTeams.ts), and that is
--    the only shape still allowed. The trigger that already refuses owner-role
--    changes on UPDATE now runs on INSERT too, for the paths that skip policies.
DROP POLICY IF EXISTS "Only premium users can add premium members" ON public.team_members;
CREATE POLICY "Only premium users can add premium members"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_premium_user(auth.uid())
    AND public.is_premium_user(user_id)
    AND (
      (
        role IN ('admin', 'member')
        AND (
          EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.team_members existing
             WHERE existing.team_id = team_members.team_id
               AND existing.user_id = auth.uid()
               AND existing.role IN ('owner', 'admin')
          )
        )
      )
      OR (
        role = 'owner'
        AND user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
      )
    )
  );

CREATE OR REPLACE FUNCTION public.refuse_team_membership_identity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- The service role, pg_cron and migrations have no auth.uid() and are left
  -- alone, exactly as guard_privileged_profile_columns does it.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'owner' AND NOT public.is_team_owner(NEW.team_id, auth.uid()) THEN
      RAISE EXCEPTION 'only the team owner can grant or remove the owner role'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    RAISE EXCEPTION
      'a membership row cannot be moved to another person or another team'
      USING ERRCODE = '42501';
  END IF;

  -- Only the team's owner may hand out or take back the owner role, themselves
  -- included. The policy above already stops an admin writing 'owner'; this
  -- also covers the paths that skip policies.
  IF NEW.role IS DISTINCT FROM OLD.role
     AND (NEW.role = 'owner' OR OLD.role = 'owner')
     AND NOT public.is_team_owner(NEW.team_id, auth.uid()) THEN
    RAISE EXCEPTION 'only the team owner can grant or remove the owner role'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refuse_team_membership_identity_change ON public.team_members;
CREATE TRIGGER refuse_team_membership_identity_change
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.refuse_team_membership_identity_change();

-- 8. activity_events INSERT checked only actor_id = auth.uid(); team_id was
--    free, so anyone could post an event into a stranger's team feed.
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.activity_events;
CREATE POLICY "Authenticated users can create events"
  ON public.activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (team_id IS NULL OR public.is_team_member(team_id, auth.uid()))
  );

-- 9. "Team owners can update their teams" had no WITH CHECK, so an owner could
--    write any owner_id and make an unconsenting person the owner. No app flow
--    transfers a team (useTeams.ts never updates owner_id).
ALTER POLICY "Team owners can update their teams" ON public.teams
  WITH CHECK (owner_id = auth.uid());

-- 10. llm_usage_events.user_id was NOT NULL, while admin_llm_usage_summary
--     defines is_machine as (user_id IS NULL) and the admin panel renders that
--     bucket. Nothing could ever write to it. The moderation classifier and the
--     embeddings backfill now record their spend with a null user, so the
--     machine bucket says what the scheduled jobs cost. record_llm_usage's
--     allowance UPDATE matches no period for a null user, which is right: there
--     is no account to charge.
ALTER TABLE public.llm_usage_events ALTER COLUMN user_id DROP NOT NULL;

-- 11. is_item_owner and is_team_member_for_item are SECURITY DEFINER, callable
--     by anyone, and take the user as a parameter, so a logged-out caller could
--     ask "does this user own this private id" for any pair. Same guard as
--     20260909040000 gave the five role predicates. The bodies are restated in
--     full, with SET search_path made explicit.
CREATE OR REPLACE FUNCTION public.is_item_owner(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'anon' THEN
    RETURN false;
  END IF;
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM public.prompts WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM public.skills WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM public.workflows WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'prompt_kit' THEN
    RETURN EXISTS (SELECT 1 FROM public.prompt_kits WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'collection' THEN
    RETURN EXISTS (SELECT 1 FROM public.collections WHERE id = p_item_id AND owner_id = p_user_id);
  ELSE
    RETURN false;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_member_for_item(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  IF coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'anon' THEN
    RETURN false;
  END IF;
  IF p_item_type = 'prompt' THEN
    SELECT team_id INTO v_team_id FROM public.prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT team_id INTO v_team_id FROM public.skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT team_id INTO v_team_id FROM public.workflows WHERE id = p_item_id;
  ELSIF p_item_type = 'prompt_kit' THEN
    SELECT team_id INTO v_team_id FROM public.prompt_kits WHERE id = p_item_id;
  ELSIF p_item_type = 'collection' THEN
    SELECT team_id INTO v_team_id FROM public.collections WHERE id = p_item_id;
  ELSE
    RETURN false;
  END IF;

  IF v_team_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (SELECT 1 FROM public.team_members WHERE team_id = v_team_id AND user_id = p_user_id);
END;
$$;

-- 12. current_setting('request.jwt.claims', true)::jsonb raises on '' (a GUC
--     set earlier in the same pooled backend reads back as an empty string,
--     which is why Supabase's own auth.jwt() wraps it in nullif). Through
--     PostgREST the value is always set, so this never bit the app; it would
--     bite the first direct pooled session, and then every policy on prompts
--     and profiles would error. The five predicates are the 20260909040000
--     bodies restated with that one wrapper.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           ''
         ) <> 'anon'
     AND EXISTS (
       SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'admin'
     )
$$;

CREATE OR REPLACE FUNCTION public.is_premium_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           ''
         ) <> 'anon'
     AND EXISTS (
       SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('premium', 'premium_gift', 'admin')
     )
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           ''
         ) <> 'anon'
     AND EXISTS (
       SELECT 1 FROM public.team_members
        WHERE team_id = p_team_id AND user_id = p_user_id
     )
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           ''
         ) <> 'anon'
     AND EXISTS (
       SELECT 1 FROM public.teams
        WHERE id = p_team_id AND owner_id = p_user_id
     )
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           ''
         ) <> 'anon'
     AND (
       EXISTS (
         SELECT 1 FROM public.teams
          WHERE id = p_team_id AND owner_id = p_user_id
       )
       OR EXISTS (
         SELECT 1 FROM public.team_members
          WHERE team_id = p_team_id AND user_id = p_user_id
            AND role IN ('owner', 'admin')
       )
     )
$$;

-- 13. 20260908120000 revoked these two from anon, but anon holds EXECUTE
--     through PUBLIC, so the revoke changed nothing (20260909020000 explains
--     the mechanism). Both refuse a null auth.uid() anyway; this makes the
--     grant say what was meant.
REVOKE ALL ON FUNCTION public.update_prompt_slug(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_prompt_slug(uuid, text, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.update_prompt_kit_slug(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_prompt_kit_slug(uuid, text, uuid) TO authenticated, service_role;

-- 14. Ten plain btree indexes that duplicate a UNIQUE constraint on the very
--     same column (the planner uses either; the unique one stays), and the
--     four GIN expression indexes that 20260908210000 replaced with the
--     generated fts column and deferred dropping. pg_stat_user_indexes on
--     2026-09-16: the four expression indexes at 0 scans. Each of the fourteen
--     cost a write on every insert and update of its table, on a Micro whose
--     disk budget D-203 was about.
DROP INDEX IF EXISTS public.idx_prompts_slug;
DROP INDEX IF EXISTS public.idx_skills_slug;
DROP INDEX IF EXISTS public.idx_workflows_slug;
DROP INDEX IF EXISTS public.llm_usage_events_user_idem_uidx;
DROP INDEX IF EXISTS public.idx_mcp_api_tokens_token_hash;
DROP INDEX IF EXISTS public.idx_prompt_slug_redirects_old_slug;
DROP INDEX IF EXISTS public.idx_blog_posts_slug;
DROP INDEX IF EXISTS public.idx_blog_categories_slug;
DROP INDEX IF EXISTS public.idx_blog_tags_slug;
DROP INDEX IF EXISTS public.idx_team_invites_token;
DROP INDEX IF EXISTS public.prompts_search_idx;
DROP INDEX IF EXISTS public.skills_search_idx;
DROP INDEX IF EXISTS public.workflows_search_idx;
DROP INDEX IF EXISTS public.prompt_kits_fts_idx;
