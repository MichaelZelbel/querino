-- Finding 9 of the 2026-09-08 audit.
--
-- backfill-embeddings selects every artifact whose embedding is NULL, every
-- two minutes. A row the provider refuses (too long, a transient error, a
-- model that went away) was refused again on every tick, each attempt a paid
-- call, for ever. The job now stamps embedding_failed_at on a failure and
-- leaves such rows alone for a day. An edit to the text clears the stamp
-- along with the embedding, so a fixed artifact is retried at once.

ALTER TABLE public.prompts     ADD COLUMN IF NOT EXISTS embedding_failed_at timestamptz;
ALTER TABLE public.skills      ADD COLUMN IF NOT EXISTS embedding_failed_at timestamptz;
ALTER TABLE public.workflows   ADD COLUMN IF NOT EXISTS embedding_failed_at timestamptz;
ALTER TABLE public.prompt_kits ADD COLUMN IF NOT EXISTS embedding_failed_at timestamptz;

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
    NEW.embedding_failed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
