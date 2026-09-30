-- A comment or a suggestion keeps its author and its artifact, and a review is
-- signed by whoever gives it (2026-09-30 audit).
--
-- What was wrong. The UPDATE policies on comments and suggestions check who
-- may edit a row, not which columns change:
--   * "Item owners can review suggestions" checks only that the caller owns
--     the artifact. The owner could therefore rewrite author_id and put any
--     person's name on a suggestion, with content of the owner's choosing, on
--     a public artifact. The same UPDATE could set reviewer_id to someone else
--     and sign the review with their name.
--   * "Users can update own comments" and "Authors can update their own open
--     suggestions" let the writer rewrite item_type and item_id, so a comment
--     or suggestion written under one artifact could be moved under another
--     (a reply keeps its parent_id, which then points at another thread).
-- Reviews got exactly this guard on 2026-09-08 (refuse_review_retarget);
-- comments and suggestions never did.
--
-- How it was measured. Rehearsed on production with a comment and a
-- suggestion written by one account on another account's public prompt: the
-- writer moved both onto a second public prompt, and the prompt's owner set
-- the suggestion's author_id to a third account. Moving onto an artifact the
-- writer cannot see is already refused, because Postgres checks the updated
-- row against the SELECT policies too. Both tables hold 0 rows today, so no
-- existing row has been moved or re-signed.
--
-- What it changes. One BEFORE UPDATE trigger on each table. When the statement
-- comes from the browser roles, it refuses a change of author, artifact or
-- (for a comment) parent, and a reviewer_id other than the caller's own or
-- NULL. The service role is not affected: deleting an account still unlinks
-- the reviewer (supabase/functions/_shared/deleteUserData.ts). Editing the text
-- of a comment, and every review the app sends (reviewer_id = the caller, or
-- NULL when an author resubmits), are unchanged.

CREATE OR REPLACE FUNCTION public.refuse_discussion_move()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF NEW.item_type IS DISTINCT FROM OLD.item_type
     OR NEW.item_id IS DISTINCT FROM OLD.item_id THEN
    RAISE EXCEPTION 'A % stays on the artifact it was written on', rtrim(TG_TABLE_NAME, 's')
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF TG_TABLE_NAME = 'comments' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
      RAISE EXCEPTION 'A comment keeps its author and its place in the thread'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'A suggestion keeps its author'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id
     AND NEW.reviewer_id IS NOT NULL
     AND NEW.reviewer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'A review is signed by whoever gives it'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.refuse_discussion_move() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refuse_discussion_move() FROM anon;
REVOKE ALL ON FUNCTION public.refuse_discussion_move() FROM authenticated;

DROP TRIGGER IF EXISTS refuse_discussion_move ON public.comments;
CREATE TRIGGER refuse_discussion_move
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.refuse_discussion_move();

DROP TRIGGER IF EXISTS refuse_discussion_move ON public.suggestions;
CREATE TRIGGER refuse_discussion_move
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.refuse_discussion_move();
