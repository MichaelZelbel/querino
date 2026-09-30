-- A rating, a copy count and a search embedding are computed, never written by
-- the browser (2026-09-30 audit).
--
-- What was wrong. rating_avg and rating_count are kept by the review triggers,
-- copies_count is a counter, and embedding is written by the embedding job.
-- None of them is guarded: authenticated holds UPDATE on every column of
-- prompts, skills, workflows and prompt_kits, and the owner's UPDATE policy
-- checks only who the row belongs to. So an author could PATCH their own
-- public prompt to five stars from 9999 reviews and 12345 copies, and Discover
-- sorts by rating and by copies. They could also write any vector into
-- embedding, which decides where their artifact lands in semantic search and in
-- "similar" lists for everyone else. 20260909 closed the same columns for the
-- MCP server (it picks declared columns now); the REST door stayed open.
--
-- How it was measured. Rehearsed on production as the author of a public
-- prompt: UPDATE ... SET rating_avg = 5, rating_count = 9999, copies_count =
-- 12345, embedding = <another prompt's vector> succeeded and all four stuck.
-- An INSERT with a rating of its own choosing did the same. Nobody has done it:
-- every stored rating today equals the average and count of its reviews (190
-- prompts, 19 skills, 8 workflows, 0 mismatches) and no copy count is nonzero.
--
-- What it changes. One BEFORE trigger on the four artifact tables. When the
-- statement comes straight from the browser roles (anon, authenticated), a new
-- row starts at a zero rating, zero copies and no embedding, and an update
-- keeps the stored rating, copy count and embedding. It is silent rather than
-- an error, the way guard_privileged_profile_columns treats a new profile:
-- an edit page that sends back the rating it loaded a minute ago must still
-- save. It asks current_user, not auth.uid(): the review triggers run as their
-- owner while auth.uid() is still the reviewer, and they must keep working.
-- The service role (edge functions) and postgres (cron, migrations) are not
-- affected. Clearing the embedding on a text change still works: this trigger
-- runs after clear_embedding_on_text_change and only undoes a non-null write.

CREATE OR REPLACE FUNCTION public.keep_computed_columns_computed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.rating_avg   := 0;
    NEW.rating_count := 0;
    NEW.embedding    := NULL;
    IF TG_TABLE_NAME = 'prompts' THEN
      NEW.copies_count := 0;
    END IF;
    RETURN NEW;
  END IF;

  NEW.rating_avg   := OLD.rating_avg;
  NEW.rating_count := OLD.rating_count;
  IF TG_TABLE_NAME = 'prompts' THEN
    NEW.copies_count := OLD.copies_count;
  END IF;
  IF NEW.embedding IS NOT NULL AND NEW.embedding IS DISTINCT FROM OLD.embedding THEN
    NEW.embedding := OLD.embedding;
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.keep_computed_columns_computed() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.keep_computed_columns_computed() FROM anon;
REVOKE ALL ON FUNCTION public.keep_computed_columns_computed() FROM authenticated;

-- Named so it sorts after clear_embedding_on_text_change: triggers of one
-- kind fire in name order.
DROP TRIGGER IF EXISTS guard_computed_columns ON public.prompts;
CREATE TRIGGER guard_computed_columns
  BEFORE INSERT OR UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.keep_computed_columns_computed();

DROP TRIGGER IF EXISTS guard_computed_columns ON public.skills;
CREATE TRIGGER guard_computed_columns
  BEFORE INSERT OR UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.keep_computed_columns_computed();

DROP TRIGGER IF EXISTS guard_computed_columns ON public.workflows;
CREATE TRIGGER guard_computed_columns
  BEFORE INSERT OR UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.keep_computed_columns_computed();

DROP TRIGGER IF EXISTS guard_computed_columns ON public.prompt_kits;
CREATE TRIGGER guard_computed_columns
  BEFORE INSERT OR UPDATE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.keep_computed_columns_computed();
