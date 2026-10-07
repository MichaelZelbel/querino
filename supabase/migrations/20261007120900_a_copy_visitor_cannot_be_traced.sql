-- A counted copy cannot be traced back to the visitor, and one visitor cannot
-- count as millions (2026-10-07 review).
--
-- What was wrong with record_prompt_copy (20260930130300):
--   * Its "day-salted hash" was sha256(visitor || '|' || date). The salt was
--     the public date, so the table comment's "cannot be tied to a person" was
--     false for anyone who could read the table: hashing the 24 user ids with
--     today's date matches a signed-in visitor at once, and every IPv4
--     address can be tried in minutes.
--   * A signed-out visitor was keyed by the full address. One IPv6 machine
--     holds a /64 of 2^64 addresses and could count as that many visitors,
--     pushing a prompt up Trending, which sorts by copies first.
--   * With no cf-connecting-ip it fell back to the first x-forwarded-for
--     entry, which the client writes.
--
-- How it was measured. A probe function, created and dropped again on
-- production the same afternoon, reported the request headers PostgREST
-- receives: cf-connecting-ip is always present and equals the last
-- x-forwarded-for entry, the first entry is whatever the client sent
-- (203.0.113.9 in the probe), and Cloudflare refuses outright (error 1000) a
-- request that brings its own CF-Connecting-IP. So the fallback was never
-- needed and only ever trusted the client.
--
-- What it changes.
--   * The visitor key is an HMAC under a random key made for that day, held in
--     a table no browser role can read, and deleted with the day's rows by the
--     prune job. Without the key a row is just random-looking bytes.
--   * An IPv6 visitor is keyed by their /64, an IPv4 visitor by their address.
--   * No cf-connecting-ip, no count.

CREATE TABLE IF NOT EXISTS public.prompt_copy_salts (
  day  date PRIMARY KEY,
  salt bytea NOT NULL DEFAULT extensions.gen_random_bytes(32)
);

-- No policies: only record_prompt_copy (below) and the prune job touch it.
ALTER TABLE public.prompt_copy_salts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prompt_copy_salts FROM anon, authenticated;

COMMENT ON TABLE public.prompt_copy_salts IS
  'One random key per day for the visitor hash in prompt_copy_events. Readable by no browser role; pruned with the events after two days.';

COMMENT ON TABLE public.prompt_copy_events IS
  'One row per visitor, prompt and day, so a copy is counted once. visitor_key is an HMAC under that day''s secret key (prompt_copy_salts), never a user id or an address. Pruned after two days.';

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
  v_ip inet;
  v_salt bytea;
BEGIN
  SELECT p.author_id, p.is_public INTO v_author, v_public
    FROM public.prompts p WHERE p.id = p_prompt_id;
  IF NOT FOUND OR NOT coalesce(v_public, false) THEN
    RETURN;
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() = v_author THEN
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_who := 'u:' || auth.uid()::text;
  ELSE
    BEGIN
      v_ip := (coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb
                 ->> 'cf-connecting-ip')::inet;
    EXCEPTION WHEN others THEN
      v_ip := NULL;
    END;
    IF v_ip IS NULL THEN
      RETURN;  -- nobody to count once
    END IF;
    IF family(v_ip) = 6 THEN
      v_ip := network(set_masklen(v_ip, 64));
    END IF;
    v_who := 'a:' || host(v_ip);
  END IF;

  INSERT INTO public.prompt_copy_salts (day) VALUES (current_date)
  ON CONFLICT (day) DO NOTHING;
  SELECT s.salt INTO v_salt FROM public.prompt_copy_salts s WHERE s.day = current_date;

  INSERT INTO public.prompt_copy_events (prompt_id, visitor_key, copied_on)
  VALUES (
    p_prompt_id,
    encode(hmac(convert_to(v_who, 'UTF8'), v_salt, 'sha256'), 'hex'),
    current_date
  )
  ON CONFLICT DO NOTHING;

  IF FOUND THEN
    UPDATE public.prompts SET copies_count = coalesce(copies_count, 0) + 1
     WHERE id = p_prompt_id;
  END IF;
END;
$fn$;

-- Callable by signed-out visitors on purpose (tests/security/28).
REVOKE ALL ON FUNCTION public.record_prompt_copy(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_prompt_copy(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_prompt_copy(uuid) TO authenticated;

-- Same job name, so this replaces the 20260930130300 schedule: the day's key
-- goes with the day's rows.
SELECT cron.schedule(
  'prune-prompt-copy-events',
  '25 12 * * *',
  $$DELETE FROM public.prompt_copy_events WHERE copied_on < current_date - 1;
    DELETE FROM public.prompt_copy_salts WHERE day < current_date - 1$$
);
