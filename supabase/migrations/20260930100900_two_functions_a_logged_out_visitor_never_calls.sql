-- Two SECURITY DEFINER functions stop answering the browser roles that never
-- call them (2026-09-30 audit).
--
-- What was wrong.
--   * lookup_mcp_token(p_token_hash) turns the hash of an MCP token into its
--     account id and stamps last_used_at on the token row, as its owner. Its
--     only caller is the mcp-server edge function, which uses the service
--     role. Yet anon and authenticated both held EXECUTE, so the anon key in
--     the browser bundle could drive it. A hash is not guessable, so this was
--     surface without a known way in: a credential-equivalent lookup, and a
--     write, that nobody outside the server needs.
--   * redeem_team_invite(p_token) was executable by PUBLIC and so by anon. It
--     refuses a caller without a session in its first line, so nothing got
--     through, but a logged-out visitor had no reason to reach it at all.
--
-- How it was measured. has_function_privilege() on production, and every
-- caller in the repository: lookup_mcp_token only in
-- supabase/functions/mcp-server/index.ts with the service-role client;
-- redeem_team_invite only in src/hooks/useTeamInvites.ts, after TeamJoin has
-- sent a logged-out visitor to sign in. Neither appears in any policy, which
-- is what keeps is_admin and the other predicates callable (20260909020000).
--
-- What it changes. lookup_mcp_token: service role only. redeem_team_invite:
-- signed-in users only. The MCP server and the join page behave as before.

REVOKE ALL ON FUNCTION public.lookup_mcp_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lookup_mcp_token(text) FROM anon;
REVOKE ALL ON FUNCTION public.lookup_mcp_token(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_mcp_token(text) TO service_role;

REVOKE ALL ON FUNCTION public.redeem_team_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_team_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_team_invite(text) TO authenticated;
