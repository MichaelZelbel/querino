-- Make the activity_events read rules say what they already do, 2026-08-21.
--
-- WHY THIS EXISTS
--
-- Lovable's security scanner reports this table as
--   "Personal activity events exposed to unauthenticated users"
-- at level `error`, and refuses to publish while it is unresolved.
--
-- Checked against the live database first, that report is a false positive.
-- Both SELECT policies key off auth.uid(), which is NULL for a stranger, so
-- `actor_id = NULL` is NULL and `team_id IN (empty set)` is false. Verified
-- from the outside on 2026-08-21: an anonymous SELECT returns [], a logged-in
-- non-owner returns [], an anonymous INSERT is refused, and an anonymous
-- DELETE removes nothing. No read path existed.
--
-- What the scanner is actually reacting to is that the rules never SAY any of
-- that. They lean on how NULL behaves inside IN and on auth.uid() being NULL,
-- which is correct but implicit, and an implicit rule is one refactor away
-- from not being a rule. So this migration writes the intent down:
--
--   * reads require an authenticated role, rather than relying on anon getting
--     nothing out of auth.uid()
--   * the team rule applies only to rows that HAVE a team, rather than relying
--     on `NULL IN (...)` never being true
--   * writes require an authenticated role too, on the same principle
--
-- Behaviour is unchanged. Every row visible before is visible after, to the
-- same people, and nothing new becomes visible.
--
-- ONE THING THIS DELIBERATELY DOES NOT FIX
--
-- src/hooks/useActivityEvents.ts is written as though `team_id IS NULL` events
-- were a PUBLIC feed: useGlobalActivityFeed reads them with no owner filter,
-- and useUserActivityFeed falls back to them when you view somebody else's
-- profile ("only show public events"). RLS has never allowed that, so the
-- global feed only ever shows you your own events and another person's
-- profile feed is empty. That is a product decision, not a security one, and
-- loosening RLS to match the frontend is exactly the change the scanner is
-- warning about. Decide it deliberately or leave the feeds dead, but do not
-- let a policy edit make it by accident.

BEGIN;

DROP POLICY IF EXISTS "Users can view their own events"      ON public.activity_events;
DROP POLICY IF EXISTS "Team members can view team events"    ON public.activity_events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.activity_events;

-- Your own activity, whether or not it belongs to a team.
CREATE POLICY "Users can view their own events"
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

-- A team's activity, to that team's members. `team_id IS NOT NULL` is
-- redundant against is_team_member() but is stated on purpose: it is the line
-- that makes "an event with no team is nobody's team event" explicit.
CREATE POLICY "Team members can view team events"
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND public.is_team_member(team_id, auth.uid())
  );

-- You may only log activity as yourself.
CREATE POLICY "Authenticated users can create events"
  ON public.activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

COMMENT ON TABLE public.activity_events IS
  'Per-actor and per-team activity log. Readable only by the actor, or by the '
  'members of the team the row names. Rows with team_id IS NULL are private to '
  'the actor, not public, despite what useActivityEvents.ts assumes.';

COMMIT;
