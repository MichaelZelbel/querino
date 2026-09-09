-- Search only ever matched the title.
--
-- The browser hooks (useSearchPrompts, useArtifactList) asked PostgREST for
--
--     .textSearch("title,description,content", q, { type: "websearch" })
--
-- meaning to search all three columns at once. PostgREST has no such thing as
-- a multi-column filter key. It read the string as one column name, matched
-- the first one it could make sense of, and said nothing. Verified live on
-- 2026-09-08: the word "marketing" appears in the content of four public
-- prompts and the search returned none of them. The GIN indexes created in
-- February and April cover exactly the expression the code meant to send, so
-- the index was right, the query never used it, and nobody noticed because a
-- title-only search still returns something.
--
-- The fix is one real column per table that already holds the combined
-- tsvector. A stored generated column is kept level by Postgres itself on
-- every insert and update, so there is no trigger to forget and no backfill
-- job to run. The hooks now search that one column by name, and the GIN index
-- sits directly on it, so the planner picks it up without having to recognise
-- an expression.
--
-- Config 'simple' rather than 'english' on purpose: the catalogue is
-- multilingual and the hooks already ask for 'simple'; the vector and the
-- query have to agree or nothing matches. That also means the two old
-- 'english' expression indexes on skills and workflows are now dead weight.
-- They are left in place here because dropping an index is a separate
-- decision from fixing a query, and this migration is the fix.
--
-- Description and content are nullable on some of these tables; coalesce
-- makes a null column contribute nothing rather than turning the whole vector
-- null.

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))
  ) STORED;

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))
  ) STORED;

ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))
  ) STORED;

ALTER TABLE public.prompt_kits
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS prompts_fts_column_idx
  ON public.prompts USING gin (fts);

CREATE INDEX IF NOT EXISTS skills_fts_column_idx
  ON public.skills USING gin (fts);

CREATE INDEX IF NOT EXISTS workflows_fts_column_idx
  ON public.workflows USING gin (fts);

CREATE INDEX IF NOT EXISTS prompt_kits_fts_column_idx
  ON public.prompt_kits USING gin (fts);

COMMENT ON COLUMN public.prompts.fts IS
  'Generated: to_tsvector(simple) over title, description and content. The one column the browser search filters on.';
COMMENT ON COLUMN public.skills.fts IS
  'Generated: to_tsvector(simple) over title, description and content. The one column the browser search filters on.';
COMMENT ON COLUMN public.workflows.fts IS
  'Generated: to_tsvector(simple) over title, description and content. The one column the browser search filters on.';
COMMENT ON COLUMN public.prompt_kits.fts IS
  'Generated: to_tsvector(simple) over title, description and content. The one column the browser search filters on.';
