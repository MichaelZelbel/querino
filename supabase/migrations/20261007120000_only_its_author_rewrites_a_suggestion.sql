-- Only the person who wrote a suggestion can change what it says (2026-10-07
-- review).
--
-- What was wrong. 20260930100400 stopped an artifact's owner from putting
-- another person's name on a suggestion, and named the threat exactly: "put
-- any person's name on a suggestion, with content of the owner's choosing".
-- It locked author_id, the artifact and reviewer_id, but not the text. The
-- policy "Item owners can review suggestions" lets the owner UPDATE any column
-- of a suggestion on their artifact, so the owner could still PATCH title,
-- description or content of a suggestion someone else wrote, and the page then
-- showed those words signed by that person.
--
-- How it was measured. The review calls in src/hooks/useSuggestions.ts write
-- only status, reviewer_id, review_comment and requested_changes; nothing the
-- app does as a reviewer touches the text. The table holds 0 rows today, so no
-- suggestion has been rewritten.
--
-- What it changes. refuse_discussion_move also refuses, for the browser roles,
-- a change to a suggestion's title, description or content by anyone other
-- than its author. An author editing their own open suggestion is unchanged,
-- and so is every review. The service role is not affected.
--
-- Same day, same table: a suggestion now remembers the artifact text it was
-- written against (base_content). Accepting one replaces the artifact's whole
-- content with the suggester's text, so a suggestion written on Monday and
-- accepted on Wednesday silently undid the author's Tuesday rewrite, and the
-- review window could not show it. The review window warns when the artifact
-- has changed since. Like the text, only the suggestion's author may change it.

ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS base_content text;

COMMENT ON COLUMN public.suggestions.base_content IS
  'The artifact''s content when the suggestion was written, so the review can warn that accepting it would replace edits made since. NULL on suggestions written before 2026-10-07.';

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
  IF auth.uid() IS DISTINCT FROM OLD.author_id
     AND (NEW.title IS DISTINCT FROM OLD.title
          OR NEW.description IS DISTINCT FROM OLD.description
          OR NEW.content IS DISTINCT FROM OLD.content
          OR NEW.base_content IS DISTINCT FROM OLD.base_content) THEN
    RAISE EXCEPTION 'Only its author can change what a suggestion says'
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
