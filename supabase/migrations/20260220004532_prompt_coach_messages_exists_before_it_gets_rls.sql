-- Finding 11 of the 2026-09-08 audit.
--
-- 20260220004533 turns on row-level security for prompt_coach_messages, but no
-- migration in this repository creates that table: it was made through the
-- Lovable editor and never recorded. Production has it, so this is a no-op
-- there. A fresh install (supabase db reset, or anyone self-hosting under the
-- AGPL) stopped at that line. The shape below is the live table's.

CREATE TABLE IF NOT EXISTS public.prompt_coach_messages (
  id serial PRIMARY KEY,
  session_id varchar NOT NULL,
  message jsonb NOT NULL,
  user_id uuid NOT NULL
);

ALTER TABLE public.prompt_coach_messages ENABLE ROW LEVEL SECURITY;
