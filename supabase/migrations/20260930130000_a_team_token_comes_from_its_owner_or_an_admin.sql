-- A team's GitHub token is saved by the team's owner or one of its admins
-- (2026-09-30, Michael's decision after the audit of the same day).
--
-- What was wrong. 20260930100000 closed the hole where anyone signed in could
-- plant a token on any team, and left one choice open: whether every member may
-- save the token the team syncs with, or only the people who run the team.
-- Michael chose the second. A plain member's token would otherwise become the
-- team's sync token whenever the owner has none saved, which is a member
-- deciding where every teammate's work is pushed.
--
-- How it was measured. Production has one team credential, saved by the team's
-- owner. No row changes here.
--
-- What it changes. Insert and update of a team credential need the owner or an
-- admin of that team (is_team_admin_or_owner). read_user_credential only takes
-- a team token from the owner or a current admin, so a member's old row, or an
-- admin who has since been made a plain member, never pushes. Settings hides
-- the token field from plain members.

DROP POLICY IF EXISTS "Users can insert their own credentials" ON public.user_credentials;
CREATE POLICY "Users can insert their own credentials"
  ON public.user_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (team_id IS NULL OR public.is_team_admin_or_owner(team_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update their own credentials" ON public.user_credentials;
CREATE POLICY "Users can update their own credentials"
  ON public.user_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (team_id IS NULL OR public.is_team_admin_or_owner(team_id, auth.uid()))
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
    -- The team's owner first, then the most recently written row of a current
    -- admin. A member's row, or one left by someone who is no longer an admin
    -- or no longer on the team, never pushes.
    SELECT c.* INTO v_row
      FROM public.user_credentials c
     WHERE c.credential_type = _credential_type
       AND c.team_id = _team_id
       AND (
         EXISTS (SELECT 1 FROM public.team_members tm
                  WHERE tm.team_id = _team_id AND tm.user_id = c.user_id
                    AND tm.role IN ('owner', 'admin'))
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
