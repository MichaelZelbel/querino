-- Findings 16 to 23 of the 2026-09-08 audit. Small doors around private
-- things, and two features that have quietly not worked for months.
--
-- 16. prompt_slug_redirects and prompt_kit_slug_redirects were readable by
--     everyone with USING (true). A redirect row holds the artifact's id and
--     its former address, so renaming a private prompt published its id. An id
--     is the key every other finding in this audit needs.
--
-- 17. The privileged-column guard on profiles was BEFORE UPDATE only, and the
--     insert policy is WITH CHECK (auth.uid() = id). A user whose profile row
--     is missing (an admin deleted it, or a signup trigger failed) could
--     insert a replacement naming themselves admin and premium. Enforcement of
--     money and admin rights reads user_roles, so this bought no real power,
--     but get_my_plan and the whole premium UI believe the column.
--
-- 18. is_item_public and is_team_member_for_item lost their 'collection'
--     branch when they were rewritten on 2026-04-30. Every comment policy asks
--     them, so comments on collections have been impossible since: the page
--     renders the box, the insert is refused, the list is always empty.
--
-- 19. collection_items was visible when the collection was public or owned,
--     with no team branch, so a team member could open a team collection and
--     find it empty.
--
-- 20. public_profiles selects created_at, which anon lost on 2026-08-24. The
--     view is security_invoker, so anon reading it now gets 42501. Nothing in
--     the app uses it. It goes.
--
-- 21. profiles.display_name is the identity in /u/<name>, and two users could
--     hold the same one. UserActivity does .single() on it, so both pages then
--     break. Duplicates are renamed here, oldest keeps the name, and a unique
--     index stops the next one.
--
-- 22. set_prompt_kit_slug asked generate_unique_slug about a table called
--     'prompt_kit'. The helper knows 'prompt_kits'; an unknown name falls to
--     "no such slug exists", so it never suffixed. The second kit with a given
--     title failed on the unique index with a 23505 instead.
--
-- 23. queue_menerio_sync was re-created on 2026-05-14 from an older copy,
--     which dropped the prompt_kits branch added two weeks earlier and never
--     got an INSERT trigger. Kits have not reached Menerio since. The branch
--     is back and the trigger is created.

-- ---------------------------------------------------------------------------
-- 16. A redirect is as public as the thing it points at
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read slug redirects" ON public.prompt_slug_redirects;
CREATE POLICY "Redirects are visible with the prompt"
  ON public.prompt_slug_redirects
  FOR SELECT
  USING (
    public.is_item_public('prompt', prompt_id)
    OR public.is_item_owner('prompt', prompt_id, auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can read prompt kit slug redirects" ON public.prompt_kit_slug_redirects;
CREATE POLICY "Redirects are visible with the prompt kit"
  ON public.prompt_kit_slug_redirects
  FOR SELECT
  USING (
    public.is_item_public('prompt_kit', prompt_kit_id)
    OR public.is_item_owner('prompt_kit', prompt_kit_id, auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 17. The guard also watches inserts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_privileged_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- auth.uid() is NULL for the service role, for pg_cron and for migrations,
  -- which all need to keep working.
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
      -- A new row starts on the defaults whatever the caller asked for. This
      -- is silent rather than an exception because the honest path (the
      -- signup trigger, a client inserting its own profile) sends these
      -- columns without meaning anything by them.
      NEW.plan_type   := 'free';
      NEW.role        := 'user';
      NEW.plan_source := 'internal';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.plan_type   IS DISTINCT FROM OLD.plan_type
  OR NEW.role        IS DISTINCT FROM OLD.role
  OR NEW.plan_source IS DISTINCT FROM OLD.plan_source
  THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION
        'plan_type, role and plan_source can only be changed by an admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS guard_privileged_profile_columns ON public.profiles;
CREATE TRIGGER guard_privileged_profile_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_privileged_profile_columns();

-- ---------------------------------------------------------------------------
-- 18. Collections are items again
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_item_public(p_item_type text, p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND is_public = true);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'prompt_kit' THEN
    RETURN EXISTS (SELECT 1 FROM prompt_kits WHERE id = p_item_id AND published = true);
  ELSIF p_item_type = 'collection' THEN
    RETURN EXISTS (SELECT 1 FROM collections WHERE id = p_item_id AND is_public = true);
  ELSE
    RETURN false;
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.is_item_owner(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF p_item_type = 'prompt' THEN
    RETURN EXISTS (SELECT 1 FROM prompts WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'skill' THEN
    RETURN EXISTS (SELECT 1 FROM skills WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'workflow' THEN
    RETURN EXISTS (SELECT 1 FROM workflows WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'prompt_kit' THEN
    RETURN EXISTS (SELECT 1 FROM prompt_kits WHERE id = p_item_id AND author_id = p_user_id);
  ELSIF p_item_type = 'collection' THEN
    RETURN EXISTS (SELECT 1 FROM collections WHERE id = p_item_id AND owner_id = p_user_id);
  ELSE
    RETURN false;
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.is_team_member_for_item(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_team_id UUID;
BEGIN
  IF p_item_type = 'prompt' THEN
    SELECT team_id INTO v_team_id FROM prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT team_id INTO v_team_id FROM skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT team_id INTO v_team_id FROM workflows WHERE id = p_item_id;
  ELSIF p_item_type = 'prompt_kit' THEN
    SELECT team_id INTO v_team_id FROM prompt_kits WHERE id = p_item_id;
  ELSIF p_item_type = 'collection' THEN
    SELECT team_id INTO v_team_id FROM collections WHERE id = p_item_id;
  ELSE
    RETURN false;
  END IF;

  IF v_team_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (SELECT 1 FROM team_members WHERE team_id = v_team_id AND user_id = p_user_id);
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 19. A team collection shows its items to the team
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Team members can view team collection items" ON public.collection_items;
CREATE POLICY "Team members can view team collection items"
  ON public.collection_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
     WHERE c.id = collection_items.collection_id
       AND c.team_id IS NOT NULL
       AND public.is_team_member(c.team_id, auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- 20. A view nobody reads and anon cannot read
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.public_profiles;

-- ---------------------------------------------------------------------------
-- 21. One display name, one person
-- ---------------------------------------------------------------------------
WITH ranked AS (
  SELECT id,
         display_name,
         row_number() OVER (
           PARTITION BY lower(display_name)
           ORDER BY created_at, id
         ) AS n
    FROM public.profiles
   WHERE display_name IS NOT NULL
     AND display_name <> ''
)
UPDATE public.profiles p
   SET display_name = ranked.display_name || '-' || ranked.n
  FROM ranked
 WHERE p.id = ranked.id
   AND ranked.n > 1;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_unique_ci
  ON public.profiles (lower(display_name))
  WHERE display_name IS NOT NULL AND display_name <> '';

-- ---------------------------------------------------------------------------
-- 22. A prompt kit slug is checked against the prompt kits
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_prompt_kit_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompt_kits', NEW.id);
  END IF;
  RETURN NEW;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 23. Prompt kits reach Menerio again
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_menerio_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_artifact_type text;
  v_integration record;
  v_should_queue boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'prompts' THEN
    v_artifact_type := 'prompt';
  ELSIF TG_TABLE_NAME = 'skills' THEN
    v_artifact_type := 'skill';
  ELSIF TG_TABLE_NAME = 'workflows' THEN
    v_artifact_type := 'workflow';
  ELSIF TG_TABLE_NAME = 'prompt_kits' THEN
    v_artifact_type := 'prompt_kit';
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
$fn$;

DROP TRIGGER IF EXISTS queue_menerio_sync_on_prompt_kits_insert ON public.prompt_kits;
CREATE TRIGGER queue_menerio_sync_on_prompt_kits_insert
  AFTER INSERT ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.queue_menerio_sync();
