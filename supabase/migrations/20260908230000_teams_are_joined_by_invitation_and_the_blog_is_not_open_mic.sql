-- Findings 12 to 15 of the 2026-09-08 audit. Four doors that were left open
-- when the feature behind them changed shape.
--
-- 12. Teams were joinable by anyone premium. "Premium users can join teams as
--     members" let a caller insert their own membership row into ANY team, and
--     "Premium users can view teams to join" showed them every team row to
--     pick from, repository settings included. That was the model before
--     invite links; since then joining goes through redeem_team_invite, which
--     is SECURITY DEFINER and checks the token. The two old policies stayed
--     behind and were the whole gate: with them, one insert made a stranger a
--     member, and every "Premium team members can view team ..." policy then
--     opened that team's private prompts, skills, workflows, kits and
--     collections to them.
--
-- 13. team_members UPDATE had no WITH CHECK and no column restriction, so an
--     admin could write role = 'owner' onto their own row (the delete policy
--     refuses to remove an owner, so that is a permanent seat), or move
--     someone else's row to another team by rewriting user_id or team_id. The
--     app only ever sends 'admin' or 'member', which is now also the rule.
--
-- 14. user_credentials let a caller attach a row to any team_id. The team
--     branch of read_user_credential took the first row it found for that
--     team, with no ordering, so a planted GitHub token could be picked up by
--     the sync worker and used for that team's pushes. Writing a team
--     credential now requires being that team's owner or admin, and the read
--     prefers the owner's row and then the newest, so it is deterministic even
--     where two admins have both saved one.
--
-- 15. Any signed-in user could publish on the blog. "Authors can create posts"
--     checked only that author_id was their own, and the status column accepts
--     'published' with a published_at they choose, so a free account could put
--     a post on /blog and in the RSS feed. They could not edit it afterwards
--     (the update policy was drafts only), which made cleanup an admin job.
--     The admin UI already gates itself on the admin role (BlogAdminLayout
--     reads useUserRole); the database now agrees. Media, taxonomy links and
--     revisions follow the same rule.

-- ---------------------------------------------------------------------------
-- 12. Teams are joined by invitation
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Premium users can join teams as members" ON public.team_members;
DROP POLICY IF EXISTS "Premium users can view teams to join" ON public.teams;

-- ---------------------------------------------------------------------------
-- 13. A membership row keeps its identity, and only the owner is an owner
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Team owners and admins can update members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON public.team_members;
CREATE POLICY "Team owners and admins can update members"
  ON public.team_members
  FOR UPDATE
  TO authenticated
  USING (public.is_team_admin_or_owner(team_id, auth.uid()))
  WITH CHECK (
    public.is_team_admin_or_owner(team_id, auth.uid())
    AND role IN ('admin', 'member')
  );

CREATE OR REPLACE FUNCTION public.refuse_team_membership_identity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- The service role, pg_cron and migrations have no auth.uid() and are left
  -- alone, exactly as guard_privileged_profile_columns does it.
  IF auth.uid() IS NULL THEN
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
$fn$;

REVOKE ALL ON FUNCTION public.refuse_team_membership_identity_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refuse_team_membership_identity_change() FROM anon;
REVOKE ALL ON FUNCTION public.refuse_team_membership_identity_change() FROM authenticated;

DROP TRIGGER IF EXISTS refuse_team_membership_identity_change ON public.team_members;
CREATE TRIGGER refuse_team_membership_identity_change
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.refuse_team_membership_identity_change();

-- ---------------------------------------------------------------------------
-- 14. A team credential belongs to that team's owner or admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own credentials" ON public.user_credentials;
CREATE POLICY "Users can insert their own credentials"
  ON public.user_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      team_id IS NULL
      OR public.is_team_admin_or_owner(team_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own credentials" ON public.user_credentials;
CREATE POLICY "Users can update their own credentials"
  ON public.user_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      team_id IS NULL
      OR public.is_team_admin_or_owner(team_id, auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.read_user_credential(
  _credential_type text,
  _user_id uuid DEFAULT NULL,
  _team_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $fn$
DECLARE
  v_row public.user_credentials;
  v_secret text;
BEGIN
  IF _team_id IS NOT NULL THEN
    -- The team's own owner first, then the most recently written row, so two
    -- admins each holding a token cannot make this answer differ per call.
    -- This ORDER BY is the only change to the body; everything else is the
    -- 20260821210000 original, fallback included.
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
$fn$;

REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.read_user_credential(text, uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 15. The blog is written by admins
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can create posts" ON public.blog_posts;
CREATE POLICY "Admins write the blog"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authors can update their own drafts" ON public.blog_posts;
CREATE POLICY "Admins edit their own posts"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = author_id AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authors can delete their own drafts" ON public.blog_posts;
CREATE POLICY "Admins delete their own drafts"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    AND public.is_admin(auth.uid())
    AND status = 'draft'
  );

DROP POLICY IF EXISTS "Authors can upload media" ON public.blog_media;
CREATE POLICY "Admins upload blog media"
  ON public.blog_media
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authors can manage their post categories" ON public.blog_post_categories;
CREATE POLICY "Admins manage their post categories"
  ON public.blog_post_categories
  FOR ALL
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.blog_posts p
       WHERE p.id = blog_post_categories.post_id
         AND p.author_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.blog_posts p
       WHERE p.id = blog_post_categories.post_id
         AND p.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can manage their post tags" ON public.blog_post_tags;
CREATE POLICY "Admins manage their post tags"
  ON public.blog_post_tags
  FOR ALL
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.blog_posts p
       WHERE p.id = blog_post_tags.post_id
         AND p.author_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.blog_posts p
       WHERE p.id = blog_post_tags.post_id
         AND p.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can create revisions for own posts" ON public.blog_post_revisions;
CREATE POLICY "Admins create revisions for their own posts"
  ON public.blog_post_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.blog_posts p
       WHERE p.id = blog_post_revisions.post_id
         AND p.author_id = auth.uid()
    )
  );
