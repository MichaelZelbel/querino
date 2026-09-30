-- A team's GitHub token can only come from someone with a seat on that team
-- (2026-09-30 audit).
--
-- What was wrong. 20260908230000 (finding 14 of the 2026-09-08 audit) meant to
-- stop anyone attaching a credential to a team they are not in. It rewrote the
-- policies "Users can insert their own credentials" and "Users can update
-- their own credentials", but two older permissive policies from
-- 20260129173152, "Users can only insert their own credentials" and "Users can
-- only update their own credentials", check nothing but auth.uid() = user_id.
-- Permissive policies are OR-ed, so the older pair alone admitted any team_id
-- and the fix never took effect. Any signed-in account could plant its own
-- token on any team (team ids are on every public team artifact), and
-- read_user_credential, which the GitHub worker calls for a team's pushes,
-- picks the owner's row first and otherwise the newest, so a planted token
-- becomes the one the team syncs with whenever the owner has not saved one.
-- It also kept using the token of someone who had since left the team.
--
-- How it was measured. Rehearsed on production as a signed-in account with no
-- seat on the only team: the INSERT with that team_id succeeded. With the
-- owner's token parked, read_user_credential returned the planted token.
-- Today the one team's owner has a token saved, so the worker would still have
-- used the owner's; the hole was open, not yet walked through. 2 credential
-- rows exist, 1 team-scoped, and it is the owner's.
--
-- What it changes.
--   1. The two loose policies go. The remaining INSERT and UPDATE policies
--      admit a team_id only when the caller has a seat on that team (a
--      membership row, or the team's owner). That is a member, not only an
--      admin as 20260908230000 wrote, because Settings tells every member
--      "you can save your own access token for this team" and saves it; the
--      admin-only rule would have broken that screen for plain members.
--   2. read_user_credential only considers team rows whose user still has a
--      seat, so a row written before this migration, or by someone who has
--      since left, is never used. Same body as today otherwise.
--   3. Losing a seat (leaving, being removed) deletes that person's tokens for
--      that team. They were stored for pushes they can no longer make.

DROP POLICY IF EXISTS "Users can only insert their own credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "Users can only update their own credentials" ON public.user_credentials;

DROP POLICY IF EXISTS "Users can insert their own credentials" ON public.user_credentials;
CREATE POLICY "Users can insert their own credentials"
  ON public.user_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      team_id IS NULL
      OR public.is_team_member(team_id, auth.uid())
      OR public.is_team_owner(team_id, auth.uid())
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
      OR public.is_team_member(team_id, auth.uid())
      OR public.is_team_owner(team_id, auth.uid())
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
    -- The team's own owner first, then the most recently written row, and
    -- only rows of someone who still has a seat on the team: a row planted
    -- before 2026-09-30, or left behind by someone who has gone, never pushes.
    SELECT c.* INTO v_row
      FROM public.user_credentials c
     WHERE c.credential_type = _credential_type
       AND c.team_id = _team_id
       AND (
         EXISTS (SELECT 1 FROM public.team_members tm
                  WHERE tm.team_id = _team_id AND tm.user_id = c.user_id)
         OR EXISTS (SELECT 1 FROM public.teams t
                     WHERE t.id = _team_id AND t.owner_id = c.user_id)
       )
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
$fn$;

REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.read_user_credential(text, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.read_user_credential(text, uuid, uuid) TO service_role;

-- Runs as its owner because the person deleting the membership row is often
-- not the person whose token it is (an admin removing a member), and
-- user_credentials is readable only by the row's own user.
CREATE OR REPLACE FUNCTION public.drop_team_credentials_with_the_seat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  DELETE FROM public.user_credentials c
   WHERE c.user_id = OLD.user_id
     AND c.team_id = OLD.team_id
     AND NOT EXISTS (SELECT 1 FROM public.teams t
                      WHERE t.id = OLD.team_id AND t.owner_id = OLD.user_id);
  RETURN OLD;
END;
$fn$;

REVOKE ALL ON FUNCTION public.drop_team_credentials_with_the_seat() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.drop_team_credentials_with_the_seat() FROM anon;
REVOKE ALL ON FUNCTION public.drop_team_credentials_with_the_seat() FROM authenticated;

DROP TRIGGER IF EXISTS drop_team_credentials_with_the_seat ON public.team_members;
CREATE TRIGGER drop_team_credentials_with_the_seat
  AFTER DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.drop_team_credentials_with_the_seat();
