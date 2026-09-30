-- Copying a prompt is counted (2026-09-30, Michael's decision after the audit
-- of the same day).
--
-- What was wrong. prompts.copies_count is shown on every card ("0 copies") and
-- is the first key of Discover's Trending order, but nothing anywhere ever
-- increased it: all 190 prompts said 0, so Trending was really rating and date.
-- 20260930100200 made the column computed rather than writable by the browser,
-- which is what makes a counter possible without letting authors type in a
-- number.
--
-- What it changes. record_prompt_copy(prompt id) is what the Copy and
-- "send to ChatGPT/Claude" buttons call. It counts a copy of a public prompt
-- at most once per visitor, per prompt, per day, and never the author's own.
-- A visitor is the signed-in user, or else the address the request came from,
-- and it is stored only as a hash salted with the day, so a row cannot be
-- tied to a person or to the same visitor on another day; the rows are only
-- needed for that one day and the daily prune removes them after two.

CREATE TABLE IF NOT EXISTS public.prompt_copy_events (
  prompt_id   uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  copied_on   date NOT NULL DEFAULT current_date,
  PRIMARY KEY (prompt_id, visitor_key, copied_on)
);

-- No policies: only record_prompt_copy (below) and the service role touch it.
ALTER TABLE public.prompt_copy_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prompt_copy_events FROM anon, authenticated;

COMMENT ON TABLE public.prompt_copy_events IS
  'One row per visitor, prompt and day, so a copy is counted once. visitor_key is a day-salted hash, never a user id or an address. Pruned after two days.';

CREATE OR REPLACE FUNCTION public.record_prompt_copy(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $fn$
DECLARE
  v_author uuid;
  v_public boolean;
  v_who text;
  v_headers jsonb;
BEGIN
  SELECT p.author_id, p.is_public INTO v_author, v_public
    FROM public.prompts p WHERE p.id = p_prompt_id;
  IF NOT FOUND OR NOT coalesce(v_public, false) THEN
    RETURN;
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() = v_author THEN
    RETURN;
  END IF;

  v_headers := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_who := coalesce(
    auth.uid()::text,
    v_headers ->> 'cf-connecting-ip',
    split_part(v_headers ->> 'x-forwarded-for', ',', 1),
    ''
  );
  IF v_who = '' THEN
    RETURN;  -- nobody to count once
  END IF;

  INSERT INTO public.prompt_copy_events (prompt_id, visitor_key, copied_on)
  VALUES (
    p_prompt_id,
    encode(digest(v_who || '|' || current_date::text, 'sha256'), 'hex'),
    current_date
  )
  ON CONFLICT DO NOTHING;

  IF FOUND THEN
    UPDATE public.prompts SET copies_count = coalesce(copies_count, 0) + 1
     WHERE id = p_prompt_id;
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.record_prompt_copy(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_prompt_copy(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_prompt_copy(uuid) TO authenticated;

-- The daily prune job keeps the queues small; this table joins it.
SELECT cron.schedule(
  'prune-prompt-copy-events',
  '25 12 * * *',
  $$DELETE FROM public.prompt_copy_events WHERE copied_on < current_date - 1$$
);
