-- An invite is only as good as its maker's right to make it (2026-10-07
-- review).
--
-- What was wrong. redeem_team_invite checks the token and its expiry, never
-- whether the person who created the invite is still the team's owner or an
-- admin, and removing or demoting someone left their invites in place. So an
-- admin who expected to be demoted or removed could first create an 'admin'
-- invite, keep the token, and come back as admin afterwards: the function
-- inserts the seat with definer rights, and refuse_team_membership_identity_change
-- only guards the owner role. expires_at had no upper bound either, so the
-- invite could be made to last for ever ('infinity').
--
-- How it was measured. Read from production: the function body has no check
-- on created_by; the only CHECK on team_invites is on role; no trigger touches
-- team_invites when a seat goes. There are no invites today.
--
-- What it changes.
--   * redeem_team_invite and get_team_invite_preview treat an invite whose
--     maker is no longer the owner or an admin of its team as not there.
--   * Losing a seat, or dropping from admin to member, deletes the invites
--     that person made for that team (the team's owner keeps theirs).
--   * An invite lasts at most 30 days. The app's default is 14.

CREATE OR REPLACE FUNCTION public.redeem_team_invite(p_token text)
RETURNS TABLE(team_id uuid, team_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_invite RECORD;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_premium_user(v_user) THEN
    RAISE EXCEPTION 'Teams need a Premium account. Contact support@querino.ai to upgrade.';
  END IF;

  SELECT * INTO v_invite FROM public.team_invites i WHERE i.token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  -- The seat is granted on the maker's authority, so the maker must still
  -- hold it. Same wording as a missing token: the holder learns nothing more.
  IF NOT public.is_team_admin_or_owner(v_invite.team_id, v_invite.created_by) THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.team_members tm
     WHERE tm.team_id = v_invite.team_id AND tm.user_id = v_user
  ) THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_invite.team_id, v_user, v_invite.role);

    UPDATE public.team_invites SET used_count = used_count + 1
     WHERE id = v_invite.id;
  END IF;

  RETURN QUERY
  SELECT t.id, t.name FROM public.teams t WHERE t.id = v_invite.team_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.redeem_team_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_team_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_team_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_team_invite_preview(p_token text)
RETURNS TABLE (
  team_name      text,
  role           text,
  invited_by     text,
  expires_at     timestamptz,
  already_member boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
  SELECT t.name,
         i.role,
         p.display_name,
         i.expires_at,
         EXISTS (
           SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = i.team_id AND tm.user_id = auth.uid()
         )
    FROM public.team_invites i
    JOIN public.teams t ON t.id = i.team_id
    LEFT JOIN public.profiles p ON p.id = i.created_by
   WHERE auth.uid() IS NOT NULL
     AND p_token IS NOT NULL
     AND i.token = p_token
     AND i.expires_at > now()
     AND public.is_team_admin_or_owner(i.team_id, i.created_by)
$fn$;

REVOKE ALL ON FUNCTION public.get_team_invite_preview(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_team_invite_preview(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_team_invite_preview(text) TO authenticated;

-- Housekeeping on top of the check above: an invite that can no longer be
-- redeemed should not come back to life if its maker is promoted again later.
CREATE OR REPLACE FUNCTION public.drop_invites_with_the_right_to_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (NEW.role IN ('owner', 'admin') OR OLD.role NOT IN ('owner', 'admin')) THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.team_invites i
   WHERE i.team_id = OLD.team_id
     AND i.created_by = OLD.user_id
     AND NOT EXISTS (SELECT 1 FROM public.teams t
                      WHERE t.id = OLD.team_id AND t.owner_id = OLD.user_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.drop_invites_with_the_right_to_invite() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.drop_invites_with_the_right_to_invite() FROM anon;
REVOKE ALL ON FUNCTION public.drop_invites_with_the_right_to_invite() FROM authenticated;

DROP TRIGGER IF EXISTS drop_invites_with_the_right_to_invite ON public.team_members;
CREATE TRIGGER drop_invites_with_the_right_to_invite
  AFTER DELETE OR UPDATE OF role ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.drop_invites_with_the_right_to_invite();

-- The 30 days count from a created_at the browser cannot choose (keep_created_at
-- comes from 20261007120100), or a future created_at would stretch them.
DROP TRIGGER IF EXISTS keep_created_at ON public.team_invites;
CREATE TRIGGER keep_created_at
  BEFORE INSERT OR UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.keep_created_at();

ALTER TABLE public.team_invites
  DROP CONSTRAINT IF EXISTS team_invites_lasts_at_most_30_days;
ALTER TABLE public.team_invites
  ADD CONSTRAINT team_invites_lasts_at_most_30_days
  CHECK (expires_at <= created_at + interval '30 days');
