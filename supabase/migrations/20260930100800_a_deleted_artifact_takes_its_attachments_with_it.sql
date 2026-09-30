-- Deleting an artifact deletes its AI insights, comments, suggestions and
-- collection entries (2026-09-30 audit).
--
-- What was wrong. ai_insights, comments, suggestions and collection_items
-- point at an artifact through (item_type, item_id), which no foreign key can
-- follow, so deleting a prompt, skill, workflow or prompt kit left all of them
-- behind. Account deletion cleans up because deleteUserData.ts walks the
-- tables by hand; deleting one artifact from the library does not. What stays
-- is other people's text attached to nothing: comments and suggestions that no
-- policy shows any more (is_item_public is false for a missing row), and
-- entries in other users' public collections that still point at the deleted
-- id and are still readable by everyone. The same holds for comments on a
-- deleted collection.
--
-- How it was measured. On production 1 of 9 AI insights belongs to a prompt
-- that no longer exists; comments, suggestions and collection items have no
-- orphans yet (0, 0 and 0 of 0, 0 and 4). Rehearsed: an author deleting their
-- prompt and skill left 7 attached rows behind (2 insights, 2 comments,
-- 1 suggestion, 2 collection entries).
--
-- What it changes. An AFTER DELETE trigger on the four artifact tables, and on
-- collections for the comments written on one, deletes the rows that name the
-- deleted id. It runs as its owner because the rows belong to other people
-- (someone else's comment, someone else's collection) and the person deleting
-- could not delete them under row-level security. Activity events, the sync
-- queues and github_sync_state are deliberately left alone: the first is
-- history, and the others are how the deletion reaches GitHub and Menerio.
-- The one insight that is already orphaned is not touched here; removing it
-- is a data change and is left to a decision.

CREATE OR REPLACE FUNCTION public.delete_artifact_attachments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_item_type text := CASE TG_TABLE_NAME
                        WHEN 'prompts'     THEN 'prompt'
                        WHEN 'skills'      THEN 'skill'
                        WHEN 'workflows'   THEN 'workflow'
                        WHEN 'prompt_kits' THEN 'prompt_kit'
                        WHEN 'collections' THEN 'collection'
                      END;
BEGIN
  IF v_item_type IS NULL THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.comments
   WHERE item_type = v_item_type AND item_id = OLD.id;

  -- A collection's own entries already go with it (collection_items has a
  -- foreign key to collections); the rest only apply to artifacts.
  IF v_item_type <> 'collection' THEN
    DELETE FROM public.ai_insights
     WHERE item_type = v_item_type AND item_id = OLD.id;
    DELETE FROM public.suggestions
     WHERE item_type = v_item_type AND item_id = OLD.id;
    DELETE FROM public.collection_items
     WHERE item_type = v_item_type AND item_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$fn$;

-- The other three tables already have an index on (item_type, item_id);
-- suggestions did not, and useSuggestions filters on exactly that too.
CREATE INDEX IF NOT EXISTS idx_suggestions_item ON public.suggestions (item_type, item_id);

REVOKE ALL ON FUNCTION public.delete_artifact_attachments() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_artifact_attachments() FROM anon;
REVOKE ALL ON FUNCTION public.delete_artifact_attachments() FROM authenticated;

DROP TRIGGER IF EXISTS delete_artifact_attachments ON public.prompts;
CREATE TRIGGER delete_artifact_attachments
  AFTER DELETE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.delete_artifact_attachments();

DROP TRIGGER IF EXISTS delete_artifact_attachments ON public.skills;
CREATE TRIGGER delete_artifact_attachments
  AFTER DELETE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.delete_artifact_attachments();

DROP TRIGGER IF EXISTS delete_artifact_attachments ON public.workflows;
CREATE TRIGGER delete_artifact_attachments
  AFTER DELETE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.delete_artifact_attachments();

DROP TRIGGER IF EXISTS delete_artifact_attachments ON public.prompt_kits;
CREATE TRIGGER delete_artifact_attachments
  AFTER DELETE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.delete_artifact_attachments();

DROP TRIGGER IF EXISTS delete_artifact_attachments ON public.collections;
CREATE TRIGGER delete_artifact_attachments
  AFTER DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.delete_artifact_attachments();
