-- Activity on a team's item shows in that team's feed (2026-10-07 review).
--
-- What was wrong. Comments and suggestions log their activity from the
-- browser (src/hooks/useComments.ts, useSuggestions.ts) without a team_id, and
-- the read policy shows an event to its actor or to members of the event's
-- team. So when a teammate commented on, suggested a change to, or reviewed a
-- suggestion on a team prompt, nobody else on the team ever saw it: not in
-- Team Activity, not in the item's activity sidebar. Every other caller has to
-- remember to pass the item's own team as well (useAIInsights says why it is
-- the item's team and not the open workspace), which is how these two forgot.
--
-- What it changes. A BEFORE INSERT trigger on activity_events: when an event
-- names an item but no team, it takes the item's team, provided the actor is a
-- member of it. A non-member commenting on a team's public prompt keeps a
-- private event, as before, and the insert policy (team_id NULL or a team of
-- the actor's) still holds for the row the trigger produces.

CREATE OR REPLACE FUNCTION public.activity_takes_the_items_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_team uuid;
BEGIN
  IF NEW.team_id IS NOT NULL OR NEW.item_id IS NULL OR NEW.actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_team := CASE NEW.item_type
    WHEN 'prompt'     THEN (SELECT team_id FROM public.prompts     WHERE id = NEW.item_id)
    WHEN 'skill'      THEN (SELECT team_id FROM public.skills      WHERE id = NEW.item_id)
    WHEN 'workflow'   THEN (SELECT team_id FROM public.workflows   WHERE id = NEW.item_id)
    WHEN 'prompt_kit' THEN (SELECT team_id FROM public.prompt_kits WHERE id = NEW.item_id)
    WHEN 'collection' THEN (SELECT team_id FROM public.collections WHERE id = NEW.item_id)
  END;

  IF v_team IS NOT NULL AND public.is_team_member(v_team, NEW.actor_id) THEN
    NEW.team_id := v_team;
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.activity_takes_the_items_team() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activity_takes_the_items_team() FROM anon;
REVOKE ALL ON FUNCTION public.activity_takes_the_items_team() FROM authenticated;

DROP TRIGGER IF EXISTS activity_takes_the_items_team ON public.activity_events;
CREATE TRIGGER activity_takes_the_items_team
  BEFORE INSERT ON public.activity_events
  FOR EACH ROW EXECUTE FUNCTION public.activity_takes_the_items_team();
