-- Embeddings keep themselves current.
--
-- Until today nothing in this project generated an embedding when an artifact
-- was written. Not the web hooks, not create_skill in the MCP server, not a
-- trigger. A row got one when an admin pressed Backfill on the Admin page, or
-- when someone pressed Refresh on the artifact itself. That is it.
--
-- Every semantic RPC filters `published = true AND embedding IS NOT NULL`, so
-- an artifact with no embedding is absent from concept search and nothing
-- anywhere says so. It looks exactly like an artifact nobody wanted. When this
-- migration was written that was 62 rows, 40 of them published, including 38
-- public prompts.
--
-- Two halves, and the point of both is that no future write path has to
-- remember anything:
--
--   1. A BEFORE UPDATE trigger clears the embedding when the text it was made
--      from changes. New rows already start NULL, so "needs an embedding" is
--      just "embedding IS NULL" and there is no queue table to keep in step.
--
--   2. pg_cron calls backfill-embeddings every two minutes to fill whatever is
--      NULL, published rows first.
--
-- The cost of being wrong in the safe direction is a re-embed nobody needed,
-- at $0.02 per million tokens. The cost of being wrong in the other direction
-- is what this migration exists to end: an artifact that is published and
-- silently unfindable.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. An edit invalidates the embedding
-- ---------------------------------------------------------------------------
--
-- Only the three columns the embedding is actually built from count. That
-- matters more than it looks: update_embedding writes the embedding column and
-- nothing else, so it leaves all three unchanged, the trigger does not fire,
-- and the worker does not chase its own tail forever.
--
-- Deliberately NOT triggered by publishing. A row that already has a current
-- embedding does not need a new one to become visible; the RPC checks the
-- published flag itself.

CREATE OR REPLACE FUNCTION public.clear_embedding_on_text_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.title       IS DISTINCT FROM OLD.title
  OR NEW.description IS DISTINCT FROM OLD.description
  OR NEW.content     IS DISTINCT FROM OLD.content THEN
    NEW.embedding := NULL;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.clear_embedding_on_text_change() IS
  'Marks an artifact as needing a new embedding by nulling the old one. The '
  'backfill-embeddings job fills every NULL every two minutes.';

DROP TRIGGER IF EXISTS clear_embedding_on_text_change ON public.prompts;
CREATE TRIGGER clear_embedding_on_text_change
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.clear_embedding_on_text_change();

DROP TRIGGER IF EXISTS clear_embedding_on_text_change ON public.skills;
CREATE TRIGGER clear_embedding_on_text_change
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.clear_embedding_on_text_change();

DROP TRIGGER IF EXISTS clear_embedding_on_text_change ON public.workflows;
CREATE TRIGGER clear_embedding_on_text_change
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.clear_embedding_on_text_change();

DROP TRIGGER IF EXISTS clear_embedding_on_text_change ON public.prompt_kits;
CREATE TRIGGER clear_embedding_on_text_change
  BEFORE UPDATE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.clear_embedding_on_text_change();

-- ---------------------------------------------------------------------------
-- 2. The job that fills them
-- ---------------------------------------------------------------------------
--
-- Same shape as the three jobs in 20260821160000: internal_job_headers() reads
-- the shared secret from Vault at run time, so no secret lands in this file.
-- backfill-embeddings moved to verify_jwt = false in the same change, because
-- these headers carry no bearer token and the gateway would otherwise refuse
-- the call before the function's own guard ever ran.
--
-- Two minutes, not thirty seconds: a new artifact is worth finding within a
-- couple of minutes, and an idle run is one cheap COUNT per table.

SELECT cron.schedule(
  'backfill-embeddings-tick',
  '*/2 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/backfill-embeddings',
    headers := public.internal_job_headers(),
    body    := jsonb_build_object('maxItems', 100)
  ) AS request_id;
  $job$
);

COMMIT;
