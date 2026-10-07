-- created_at says when a row was made, not what its author typed (2026-10-07
-- review).
--
-- What was wrong. 20260930100200 made ratings and copy counts computed because
-- Discover sorts by them, but created_at sorts Discover too: Trending is
-- copies_count, rating_avg, created_at; Newest is created_at; Top Rated breaks
-- ties with it; skills, workflows and kits list by it by default
-- (src/lib/listOrder.ts). authenticated holds UPDATE on created_at and nothing
-- guards it, so an author could PATCH their own prompt to created_at
-- '2999-01-01', or insert it that way, and it would sit first in Trending and
-- Newest for good, since almost every prompt ties at 0 copies. Comments,
-- suggestions and reviews are listed by created_at as well.
--
-- How it was measured. has_column_privilege('authenticated', 'public.prompts',
-- 'created_at', 'UPDATE') is true, likewise on the other tables below, and no
-- trigger on them mentions created_at. No row has a future created_at today,
-- and no client code writes the column, so nothing legitimate changes.
--
-- What it changes. One BEFORE trigger on every table whose order a visitor
-- sees. For the browser roles, an INSERT gets created_at = now() and an UPDATE
-- keeps the stored value. It is silent rather than an error, like
-- keep_computed_columns_computed: an edit page that sends back the row it
-- loaded must still save. The service role (the MCP server, edge functions)
-- and postgres (cron, migrations) are not affected.

CREATE OR REPLACE FUNCTION public.keep_created_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  ELSE
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.keep_created_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.keep_created_at() FROM anon;
REVOKE ALL ON FUNCTION public.keep_created_at() FROM authenticated;

DO $do$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'prompts', 'skills', 'workflows', 'prompt_kits', 'collections',
    'comments', 'suggestions',
    'prompt_reviews', 'skill_reviews', 'workflow_reviews', 'prompt_kit_reviews'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS keep_created_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER keep_created_at BEFORE INSERT OR UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.keep_created_at()', t);
  END LOOP;
END;
$do$;
