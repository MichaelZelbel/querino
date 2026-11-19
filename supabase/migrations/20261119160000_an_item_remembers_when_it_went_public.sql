-- An item remembers when it first went public, however it went public (issue
-- #66).
--
-- What was wrong. /rss.xml should tell subscribers what was just published,
-- but only prompts had a published_at column, so skills, workflows and prompt
-- kits were dated and ordered by created_at. A skill drafted privately in May
-- and published today landed under May, below everything created since, and
-- could miss the 50-item feed entirely. Even prompts.published_at was written
-- by one browser path only (the publish dialog in LibraryPromptEdit); the MCP
-- server (service role) and every edit form that flips is_public left it NULL.
-- And any author could PATCH their prompt's published_at to 2099 and sit at
-- the top of the feed for good.
--
-- How it was measured. grep: published_at is written in src/ only by
-- LibraryPromptEdit.tsx, by no edge function, and the MCP server writes with
-- the service-role key. Rehearsed on Postgres 16 with this file's functions:
-- publishing as authenticated and as a machine role stamps now(); a forged
-- date on insert or update is ignored; an edit keeps the date; unpublishing
-- and republishing keeps the first date; the backfill leaves updated_at alone.
--
-- What it changes.
--   * skills, workflows and prompt_kits get published_at, as prompts has.
--   * One BEFORE INSERT OR UPDATE trigger on the four tables owns the column
--     for every role, the service role and postgres included (the MCP server
--     is one of the publish paths): an insert starts at NULL, an update keeps
--     the stored value, and the first write that leaves the row public stamps
--     now(). Unpublishing keeps the date, so republishing does not re-announce
--     an item. An operator who must correct a date by hand disables this
--     trigger for that statement.
--   * published_at is bookkeeping for touch_artifact_updated_at: on its own it
--     is not a person's change. It only ever moves together with the
--     visibility flag, which still moves updated_at.
--   * Existing public rows get published_at where present, else created_at, so
--     the feed does not jump for what is already public. updated_at, which
--     feeds the sitemap's lastmod and Menerio's "changed since sync", stays.
-- No table, view or sequence is created; the new columns are covered by the
-- table-level grants of 20261020120000.

ALTER TABLE public.skills      ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.workflows   ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.prompt_kits ADD COLUMN IF NOT EXISTS published_at timestamptz;

COMMENT ON COLUMN public.skills.published_at IS
  'When it first became public. Set by the database (stamp_published_at); unpublishing keeps it.';
COMMENT ON COLUMN public.workflows.published_at IS
  'When it first became public. Set by the database (stamp_published_at); unpublishing keeps it.';
COMMENT ON COLUMN public.prompt_kits.published_at IS
  'When it first became public. Set by the database (stamp_published_at); unpublishing keeps it.';

-- As 20260930100300, with published_at added to the bookkeeping, before the
-- backfill below so that it does not move updated_at.
CREATE OR REPLACE FUNCTION public.touch_artifact_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- Written by jobs and triggers, never by the person editing the artifact.
  v_bookkeeping constant text[] := ARRAY[
    'updated_at', 'fts',
    'embedding', 'embedding_attempts', 'embedding_error', 'embedding_failed_at',
    'embedding_claimed_at',
    'menerio_synced', 'menerio_note_id', 'menerio_synced_at',
    'rating_avg', 'rating_count', 'copies_count',
    'published_at'
  ];
BEGIN
  IF current_user NOT IN ('anon', 'authenticated')
     AND NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - v_bookkeeping) IS DISTINCT FROM (to_jsonb(OLD) - v_bookkeeping) THEN
    NEW.updated_at := now();
  ELSE
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.touch_artifact_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_artifact_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.touch_artifact_updated_at() FROM authenticated;

UPDATE public.prompts     SET published_at = created_at WHERE is_public AND published_at IS NULL;
UPDATE public.skills      SET published_at = created_at WHERE published AND published_at IS NULL;
UPDATE public.workflows   SET published_at = created_at WHERE published AND published_at IS NULL;
UPDATE public.prompt_kits SET published_at = created_at WHERE published AND published_at IS NULL;

CREATE OR REPLACE FUNCTION public.stamp_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_now_public boolean;
BEGIN
  -- prompts spells the flag is_public, the other three published. PL/pgSQL
  -- resolves NEW.<column> only when the branch runs, so one function serves
  -- all four tables.
  IF TG_TABLE_NAME = 'prompts' THEN
    v_now_public := coalesce(NEW.is_public, false);
  ELSE
    v_now_public := coalesce(NEW.published, false);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.published_at := OLD.published_at;
  ELSE
    NEW.published_at := NULL;
  END IF;

  IF v_now_public AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.stamp_published_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stamp_published_at() FROM anon;
REVOKE ALL ON FUNCTION public.stamp_published_at() FROM authenticated;

COMMENT ON FUNCTION public.stamp_published_at() IS
  'Owns published_at on prompts, skills, workflows and prompt_kits for every role: the moment the row first became public. A value sent by a client is ignored.';

-- The name sorts before update_*, so touch_artifact_updated_at still fires
-- last and sees the stamped row.
DO $do$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['prompts', 'skills', 'workflows', 'prompt_kits'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS stamp_published_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER stamp_published_at BEFORE INSERT OR UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.stamp_published_at()', t);
  END LOOP;
END;
$do$;
