-- "Similar" and meaning-based search read every vector, not a hundredth of
-- them (2026-10-07 review).
--
-- What was wrong. prompts, skills, workflows and prompt_kits each carry an
-- ivfflat index built with lists = 100, on tables of 218, 19, 8 and 0 rows.
-- ivfflat splits the vectors into 100 buckets and, with pgvector's default
-- ivfflat.probes = 1, searches only the bucket nearest the query. With a
-- couple of rows per bucket that is not an approximation but a coin toss: the
-- planner already uses the prompts index for get_similar_prompts (ORDER BY
-- embedding <=> x LIMIT 6), and across the 156 public prompts it returned 364
-- related rows where an exact search returns 936. 39 prompts got none at all.
-- search_prompts_semantic still sorts exactly today and would flip to the
-- index as the table grows. The four indexes are also the largest objects in
-- the schema (8.6 MB) for tables of a few hundred rows.
--
-- What it changes. The four indexes go. Postgres then compares the query with
-- every vector, which at this size takes well under a millisecond and is
-- always right. When a table reaches tens of thousands of rows, add an HNSW
-- index (USING hnsw (embedding vector_cosine_ops)), which stays accurate at
-- any size, and set hnsw.iterative_scan for the filtered searches.

DROP INDEX IF EXISTS public.prompts_embedding_idx;
DROP INDEX IF EXISTS public.skills_embedding_idx;
DROP INDEX IF EXISTS public.workflows_embedding_idx;
DROP INDEX IF EXISTS public.prompt_kits_embedding_idx;
