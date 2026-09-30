-- When someone's Premium ends, they leave the teams they are a member of
-- (2026-09-30, Michael's decision after the audit of the same day).
--
-- What was wrong. Teams are a Premium feature, and the only rule that lets a
-- member read team_members asks for Premium. So a member whose Premium was
-- taken away could no longer see their team, which left them unable to press
-- Leave, while still counted as a member: their seat, and until
-- 20260930100000 their team token, stayed behind. Of the three options
-- (leave it, add a Leave list, remove the membership), Michael chose removal.
--
-- How it was measured. Premium is a row in user_roles with role premium,
-- premium_gift or admin (is_premium_user); it has no end date, an admin takes
-- it away by deleting or changing that row. Today 0 members are without
-- Premium, so the one-off pass below removes nothing.
--
-- What it changes. After a user_roles row is deleted or changed, a person left
-- with no Premium role loses every team membership except on teams they own
-- (an owner keeps their team; ownership is a separate decision). The existing
-- drop_team_credentials_with_the_seat trigger removes their team tokens with
-- the seats.

CREATE OR REPLACE FUNCTION public.leave_teams_when_premium_ends()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles r
     WHERE r.user_id = OLD.user_id
       AND r.role IN ('premium', 'premium_gift', 'admin')
  ) THEN
    RETURN NULL;
  END IF;

  DELETE FROM public.team_members tm
   WHERE tm.user_id = OLD.user_id
     AND tm.role <> 'owner'
     AND NOT EXISTS (SELECT 1 FROM public.teams t
                      WHERE t.id = tm.team_id AND t.owner_id = OLD.user_id);
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.leave_teams_when_premium_ends() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_teams_when_premium_ends() FROM anon;
REVOKE ALL ON FUNCTION public.leave_teams_when_premium_ends() FROM authenticated;

DROP TRIGGER IF EXISTS leave_teams_when_premium_ends ON public.user_roles;
CREATE TRIGGER leave_teams_when_premium_ends
  AFTER DELETE OR UPDATE OF role, user_id ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.leave_teams_when_premium_ends();

-- Anyone whose Premium ended before this trigger existed (0 people today).
DELETE FROM public.team_members tm
 WHERE tm.role <> 'owner'
   AND NOT EXISTS (SELECT 1 FROM public.teams t
                    WHERE t.id = tm.team_id AND t.owner_id = tm.user_id)
   AND NOT EXISTS (SELECT 1 FROM public.user_roles r
                    WHERE r.user_id = tm.user_id
                      AND r.role IN ('premium', 'premium_gift', 'admin'));
