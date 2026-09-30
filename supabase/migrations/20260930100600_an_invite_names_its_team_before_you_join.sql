-- An invite link names its team before you join (2026-09-30 audit; left open
-- by the 2026-09-23 review).
--
-- What was wrong. /team/join asks "Join this team?" and deliberately does not
-- join on its own. But it cannot say which team: teams are readable only by
-- their members ("Premium users can view their teams"), and team_invites only
-- by the team's owner and admins, so the person deciding whether to join sees
-- no name and no inviter, only "Someone sent you an invite". The name appears
-- after joining, which is too late to decide on it.
--
-- How it was measured. The policies above, and src/pages/TeamJoin.tsx, which
-- says so in its own comment. Rehearsed on production: no function existed
-- that a signed-in non-member could ask.
--
-- What it changes. get_team_invite_preview(p_token) returns, for a valid and
-- unexpired token only, the team's name, the role the invite grants, the
-- inviter's display name and whether the caller is already a member. It joins
-- nobody and does not count as a use of the invite; redeem_team_invite is
-- still the only way in. An unknown or expired token returns no row, so a
-- guess learns nothing. The token is 24 random bytes, and holding it is what
-- entitles the holder to this much: redeeming it would show the same name.
-- Callable by signed-in users only; TeamJoin sends a logged-out visitor to
-- sign in before it shows the prompt.

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
$fn$;

REVOKE ALL ON FUNCTION public.get_team_invite_preview(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_team_invite_preview(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_team_invite_preview(text) TO authenticated;

COMMENT ON FUNCTION public.get_team_invite_preview(text) IS
  'Names the team behind a valid, unexpired invite token for the signed-in caller, before they decide to join. Joins nobody. 2026-09-30.';
