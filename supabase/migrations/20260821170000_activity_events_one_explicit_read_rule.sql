-- activity_events, second pass: one read rule instead of two, 2026-08-21.
--
-- The first pass (20260821150000) scoped every policy TO authenticated and made
-- the team rule say `team_id IS NOT NULL`. Lovable's scanner re-flagged the
-- table anyway, with new wording that argues against itself:
--
--   "activity_events lacks a policy for team_id IS NULL rows being scoped, but
--    flagged prior: individual activity without a team is only protected by
--    actor_id match — verify."
--
-- Protected by actor_id match IS the scoping it says is missing. That scanner
-- is a language model writing prose, not a rule engine, so this migration stops
-- trying to satisfy it and does the two things that are better on their own
-- terms whether or not it ever goes quiet.
--
-- 1. ONE SELECT POLICY INSTEAD OF TWO.
--    Two permissive policies OR'd together behave exactly like one policy with
--    an OR in it, so this changes nothing at run time. It changes what a reader
--    sees: there is no longer a policy that mentions only team membership, and
--    therefore nothing that can be read as "team membership is the whole rule".
--    Both halves of the rule are now in one place, in order.
--
-- 2. actor_id BECOMES NOT NULL.
--    This is the real find. actor_id was nullable, and a row with no actor and
--    no team would be readable by nobody at all: not the person who caused it,
--    not an admin through the app, nobody. Invisible rows that still hold data.
--    prompt_coach_messages already has this problem for real, where 74 of 80
--    rows have a null user_id and are unreachable by their own author. Closing
--    it here before it happens costs nothing: all 13 existing rows have an
--    actor, and the INSERT policy requires actor_id = auth.uid(), which can
--    never be null.
--
-- WHAT IS DELIBERATELY NOT DONE
--
-- The remediation text also asks that "no public/anon role has access". The
-- anon role already gets nothing: RLS returns it zero rows, its inserts are
-- refused and its deletes remove nothing, all verified against production.
-- REVOKEing the table grant on top of that would turn today's empty list into
-- a permission error for logged-out visitors on /activity, /u/:username/activity
-- and any item page with the activity sidebar, because useActivityEvents.ts
-- rethrows a query error. That is a visible product regression traded for no
-- security whatsoever, so it is not made here.

BEGIN;

-- 1. One rule, both halves visible.
DROP POLICY IF EXISTS "Users can view their own events"   ON public.activity_events;
DROP POLICY IF EXISTS "Team members can view team events" ON public.activity_events;

CREATE POLICY "Users read their own events and their teams' events"
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (
    actor_id = auth.uid()
    OR (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()))
  );

-- 2. Every row has an owner. Backfill first so the constraint cannot fail on
--    data that already exists; today there is none to move.
DELETE FROM public.activity_events WHERE actor_id IS NULL;

ALTER TABLE public.activity_events
  ALTER COLUMN actor_id SET NOT NULL;

COMMENT ON COLUMN public.activity_events.actor_id IS
  'The user who caused the event. NOT NULL since 2026-08-21: a row with no '
  'actor and no team is readable by nobody, which is a leak of a different '
  'kind, of the data away from the person it belongs to.';

COMMIT;
