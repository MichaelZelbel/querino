-- Every creator link is checked before anyone sees it (#47).
--
-- What was missing. 20261119120000 stores a creator's link as 'pending' and
-- shows only an 'approved' one, but nothing ever checked a link, so every link
-- waited for ever.
--
-- What it changes.
--   * A new link, or one whose address or name changed, files its own review
--     row (item_type 'creator_link', item_id the link's id), the way a comment
--     does since 20261007120400. ai-moderate-content fetches the page behind a
--     guard, classifies it and writes 'approved', 'rejected' or 'unreachable'.
--     A text review of the item and a check of its link never share a row, so
--     a bad link never unpublishes the item.
--   * creator_links.check_failures counts the fetch failures in a row. An
--     hourly job, enqueue_due_creator_link_checks, files a check for a link
--     that is unreachable (at most four tries in all, six hours apart), for an
--     approved link not checked for 30 days, and for a pending link with no
--     review in six hours (the provider gave up, or the link predates this
--     migration). A rejected link waits for its author to change it.
--   * An account younger than seven days can have links on at most three
--     items. The fourth insert is refused with a message the browser shows
--     as it is (CREATOR_LINK_LIMIT_ERROR in src/lib/creatorLink.ts, which
--     tests/web/data_creatorLinkCheck_test.ts holds to this text). Changing an
--     existing link adds no item and is never refused. Two fourth links
--     inserted at the same instant can both pass; the extra one is still
--     checked.
--
-- No table, view or sequence is created. The new column is covered by the
-- table's existing grants: authors may read it and can never write it, since
-- they may only insert and update (url, label).

ALTER TABLE public.creator_links
  ADD COLUMN check_failures integer NOT NULL DEFAULT 0 CHECK (check_failures >= 0);

COMMENT ON COLUMN public.creator_links.check_failures IS
  'Fetch failures in a row. Reset to 0 by a successful check or a changed address or name.';

-- The author of the item a link sits under, or null when it is gone. Called
-- only from the definer functions below.
CREATE OR REPLACE FUNCTION public.creator_link_item_author(p_item_type text, p_item_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_item_type
    WHEN 'prompt'     THEN (SELECT author_id FROM public.prompts     WHERE id = p_item_id)
    WHEN 'skill'      THEN (SELECT author_id FROM public.skills      WHERE id = p_item_id)
    WHEN 'workflow'   THEN (SELECT author_id FROM public.workflows   WHERE id = p_item_id)
    WHEN 'prompt_kit' THEN (SELECT author_id FROM public.prompt_kits WHERE id = p_item_id)
  END;
$$;

REVOKE ALL ON FUNCTION public.creator_link_item_author(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.creator_link_item_author(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.creator_link_item_author(text, uuid) FROM authenticated;

-- 20261119120000's function, plus: a changed address or name starts its
-- failure count again.
CREATE OR REPLACE FUNCTION public.creator_link_changed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF NEW.url IS DISTINCT FROM OLD.url OR NEW.label IS DISTINCT FROM OLD.label THEN
    NEW.status := 'pending';
    NEW.checked_at := NULL;
    NEW.reason := NULL;
    NEW.check_failures := 0;
  END IF;
  IF (NEW.url, NEW.label, NEW.status, NEW.reason, NEW.checked_at, NEW.check_failures)
     IS DISTINCT FROM (OLD.url, OLD.label, OLD.status, OLD.reason, OLD.checked_at, OLD.check_failures) THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.enqueue_creator_link_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_author uuid;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.url IS NOT DISTINCT FROM OLD.url
     AND NEW.label IS NOT DISTINCT FROM OLD.label THEN
    RETURN NULL;
  END IF;
  v_author := public.creator_link_item_author(NEW.item_type, NEW.item_id);
  IF v_author IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.moderation_review_queue
    (item_type, item_id, user_id, editor_id, content_snapshot, status)
  VALUES
    ('creator_link', NEW.id, v_author, v_author, left(NEW.label || E'\n' || NEW.url, 5000), 'pending')
  ON CONFLICT (item_type, item_id) WHERE status = 'pending' DO UPDATE
    SET content_snapshot = EXCLUDED.content_snapshot;

  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.enqueue_creator_link_check() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_creator_link_check() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_creator_link_check() FROM authenticated;

DROP TRIGGER IF EXISTS enqueue_creator_link_check ON public.creator_links;
CREATE TRIGGER enqueue_creator_link_check
  AFTER INSERT OR UPDATE OF url, label ON public.creator_links
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_creator_link_check();

-- Reads auth.users, so it runs as its owner. It fires for every role, so no
-- door skips it.
CREATE OR REPLACE FUNCTION public.refuse_fourth_creator_link_of_new_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_author uuid;
  v_links integer;
BEGIN
  v_author := public.creator_link_item_author(NEW.item_type, NEW.item_id);
  IF v_author IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u
     WHERE u.id = v_author
       AND u.created_at > now() - interval '7 days'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_links
    FROM public.creator_links l
   WHERE (l.item_type, l.item_id) IN (
           SELECT 'prompt'::text, id FROM public.prompts WHERE author_id = v_author
           UNION ALL
           SELECT 'skill'::text, id FROM public.skills WHERE author_id = v_author
           UNION ALL
           SELECT 'workflow'::text, id FROM public.workflows WHERE author_id = v_author
           UNION ALL
           SELECT 'prompt_kit'::text, id FROM public.prompt_kits WHERE author_id = v_author
         );

  IF v_links >= 3 THEN
    RAISE EXCEPTION 'New accounts can add a link to at most three items in their first seven days. You can add more once your account is a week old.'
      USING ERRCODE = 'P0001', HINT = 'creator_link_new_account_limit';
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.refuse_fourth_creator_link_of_new_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refuse_fourth_creator_link_of_new_account() FROM anon;
REVOKE ALL ON FUNCTION public.refuse_fourth_creator_link_of_new_account() FROM authenticated;

DROP TRIGGER IF EXISTS refuse_fourth_creator_link_of_new_account ON public.creator_links;
CREATE TRIGGER refuse_fourth_creator_link_of_new_account
  BEFORE INSERT ON public.creator_links
  FOR EACH ROW EXECUTE FUNCTION public.refuse_fourth_creator_link_of_new_account();

-- At most 100 checks an hour, oldest first. The 4 is the first try and three
-- retries of an unreachable link; after the fourth failure it stays
-- 'unreachable' until its author changes it, which resets the count.
CREATE OR REPLACE FUNCTION public.enqueue_due_creator_link_checks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_filed integer;
BEGIN
  INSERT INTO public.moderation_review_queue
    (item_type, item_id, user_id, editor_id, content_snapshot, status)
  SELECT 'creator_link', due.id, due.author, due.author,
         left(due.label || E'\n' || due.url, 5000), 'pending'
    FROM (
      SELECT l.id, l.label, l.url,
             public.creator_link_item_author(l.item_type, l.item_id) AS author
        FROM public.creator_links l
       WHERE NOT EXISTS (
               SELECT 1 FROM public.moderation_review_queue q
                WHERE q.item_type = 'creator_link'
                  AND q.item_id = l.id
                  AND (q.status IN ('pending', 'processing')
                       OR (l.status = 'pending' AND q.created_at > now() - interval '6 hours'))
             )
         AND (    l.status = 'pending'
              OR (l.status = 'unreachable' AND l.check_failures < 4
                  AND l.checked_at < now() - interval '6 hours')
              OR (l.status = 'approved' AND l.checked_at < now() - interval '30 days'))
       ORDER BY coalesce(l.checked_at, l.created_at), l.id
       LIMIT 100
    ) due
   WHERE due.author IS NOT NULL
  ON CONFLICT (item_type, item_id) WHERE status = 'pending' DO NOTHING;

  GET DIAGNOSTICS v_filed = ROW_COUNT;
  RETURN v_filed;
END;
$fn$;

REVOKE ALL ON FUNCTION public.enqueue_due_creator_link_checks() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_due_creator_link_checks() FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_due_creator_link_checks() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_due_creator_link_checks() TO service_role;

-- Pure SQL, no address and no key. cron.schedule() replaces a job of the same
-- name in place, so running this again changes nothing.
SELECT cron.schedule(
  'creator-link-checks',
  '23 * * * *',
  $$SELECT public.enqueue_due_creator_link_checks()$$
);
