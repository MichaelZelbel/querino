-- updated_at means "someone changed this artifact", not "a job touched the row"
-- (2026-09-30 audit; left open by the 2026-09-23 review).
--
-- What was wrong. prompts, skills and workflows stamp updated_at = now() on
-- every UPDATE (update_prompts_updated_at), and prompt_kits the same through
-- update_updated_at_column. The background jobs write to these rows all day:
--   process-menerio-sync-queue, render-for-menerio, menerio-link-callback
--       menerio_synced, menerio_note_id, menerio_synced_at
--   update_embedding, record_embedding_failure (backfill-embeddings)
--       embedding, embedding_attempts, embedding_error, embedding_failed_at
--   the review triggers                     rating_avg, rating_count
--   backfill-embeddings' claim              updated_at itself, as a lease
-- Each of those moved updated_at, and updated_at feeds the sitemap's lastmod
-- and its order (src/lib/feeds.ts), dateModified on every detail page, "active
-- creators in the last 7 days", and MenerioBulkSync's test for "changed since
-- it was last synced" (updated_at > menerio_synced_at).
--
-- How it was measured. On production every one of the 171 artifacts marked as
-- synced to Menerio (148 prompts, 17 skills, 6 workflows) has updated_at later
-- than menerio_synced_at, 63 of them by under five seconds and the smallest by
-- 9 ms: the worker writes menerio_synced_at from its own clock and this
-- trigger then stamps the database's, a moment later. So "Sync all" treats
-- every synced artifact as changed, every time. Rehearsed: a service-role
-- write of menerio_synced_at alone, update_embedding, and a review by someone
-- else each moved updated_at.
--
-- What it changes. One trigger function for the four artifact tables, in place
-- of the two shared ones (which other tables keep using):
--   * updated_at moves to now() when any column other than the ones above, or
--     generated fts, changed. A new column counts as a real change by default.
--   * A write that changes only those columns keeps the old updated_at.
--   * A machine (the service role, cron) that sets updated_at itself is
--     obeyed, because backfill-embeddings claims a row by stamping updated_at
--     and treats a fresh stamp as "taken". The browser is never obeyed: a
--     browser write that changes nothing else keeps the old value.
--   * embedding_claimed_at is added, so that claim can move off updated_at.
--     Nothing reads it yet; backfill-embeddings switches to it separately.
-- Existing rows are not touched. The 171 stale-looking ones heal on their next
-- sync, which now stamps menerio_synced_at after updated_at and moves nothing.

ALTER TABLE public.prompts     ADD COLUMN IF NOT EXISTS embedding_claimed_at timestamptz;
ALTER TABLE public.skills      ADD COLUMN IF NOT EXISTS embedding_claimed_at timestamptz;
ALTER TABLE public.workflows   ADD COLUMN IF NOT EXISTS embedding_claimed_at timestamptz;
ALTER TABLE public.prompt_kits ADD COLUMN IF NOT EXISTS embedding_claimed_at timestamptz;

COMMENT ON COLUMN public.prompts.embedding_claimed_at IS
  'Lease of the embedding job on this row. Not a user-visible change; does not move updated_at.';
COMMENT ON COLUMN public.skills.embedding_claimed_at IS
  'Lease of the embedding job on this row. Not a user-visible change; does not move updated_at.';
COMMENT ON COLUMN public.workflows.embedding_claimed_at IS
  'Lease of the embedding job on this row. Not a user-visible change; does not move updated_at.';
COMMENT ON COLUMN public.prompt_kits.embedding_claimed_at IS
  'Lease of the embedding job on this row. Not a user-visible change; does not move updated_at.';

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
    'rating_avg', 'rating_count', 'copies_count'
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

-- Every name starts with update_ so it fires after the other BEFORE UPDATE
-- triggers (they fire in name order) and sees the row they produced.
DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.touch_artifact_updated_at();

DROP TRIGGER IF EXISTS update_skills_updated_at ON public.skills;
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.touch_artifact_updated_at();

DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.touch_artifact_updated_at();

DROP TRIGGER IF EXISTS prompt_kits_updated_at ON public.prompt_kits;
DROP TRIGGER IF EXISTS update_prompt_kits_updated_at ON public.prompt_kits;
CREATE TRIGGER update_prompt_kits_updated_at
  BEFORE UPDATE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.touch_artifact_updated_at();
