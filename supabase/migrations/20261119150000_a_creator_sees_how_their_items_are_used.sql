-- Each creator sees views, sends per assistant, copies and link clicks for
-- their items (#48).
--
-- What was missing. The only number a creator had was prompts.copies_count, a
-- lifetime total for prompts alone that does not say where a prompt was sent.
-- Skills, workflows and kits counted nothing, Download .md counted nothing,
-- page views were not counted at all, and creator_links.click_count is a
-- lifetime total.
--
-- What it changes.
--   * item_stats_daily holds, per item and day, a count of page views, copies
--     (Download .md included), sends to each of the four assistants and
--     creator-link clicks. Nothing about a visitor is in it: only the item, the
--     day and the counts. Only the item's author can read their rows; anon and
--     every other person read nothing. Rows are kept for 400 days.
--   * record_item_use counts a copy, a download or a send once per visitor,
--     item, channel and day, with the visitor key of record_prompt_copy
--     (20261007120900): an HMAC under the day's key in prompt_copy_salts, kept
--     in item_use_events and pruned with the salts. Copy and download share the
--     "copies" count. record_prompt_copy now goes through it, and
--     copies_count still rises exactly as before: once per visitor, prompt and
--     day for a copy or a send, never for a download.
--   * record_item_view counts a page view. It stores no visitor key, no
--     address and no row per visitor, so it cannot tell one visitor from
--     another; it refuses a missing user agent and known bots.
--   * follow_creator_link also adds the click to the day's row.
--   * The author's own views, copies and sends are never counted, and only a
--     public item is.

CREATE TABLE public.item_stats_daily (
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'skill', 'workflow', 'prompt_kit')),
  item_id uuid NOT NULL,
  day date NOT NULL,
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  copies integer NOT NULL DEFAULT 0 CHECK (copies >= 0),
  sends_chatgpt integer NOT NULL DEFAULT 0 CHECK (sends_chatgpt >= 0),
  sends_claude integer NOT NULL DEFAULT 0 CHECK (sends_claude >= 0),
  sends_gemini integer NOT NULL DEFAULT 0 CHECK (sends_gemini >= 0),
  sends_perplexity integer NOT NULL DEFAULT 0 CHECK (sends_perplexity >= 0),
  clicks integer NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  PRIMARY KEY (item_type, item_id, day)
);

COMMENT ON TABLE public.item_stats_daily IS
  'Per item and UTC day: page views, copies (Download .md included), sends per assistant and creator-link clicks. Nothing about a visitor. Readable only by the item''s author; written only by record_item_use, record_item_view and follow_creator_link. Kept for 400 days.';

CREATE INDEX idx_item_stats_daily_day ON public.item_stats_daily (day);

ALTER TABLE public.item_stats_daily ENABLE ROW LEVEL SECURITY;

revoke all on public.item_stats_daily from anon;
revoke all on public.item_stats_daily from authenticated;
grant select on public.item_stats_daily to authenticated;
grant select, insert, update, delete on public.item_stats_daily to service_role;

CREATE POLICY "Authors read the numbers of their own items"
  ON public.item_stats_daily FOR SELECT TO authenticated
  USING (public.is_item_owner(item_type, item_id, auth.uid()));

CREATE TABLE public.item_use_events (
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'skill', 'workflow', 'prompt_kit')),
  item_id uuid NOT NULL,
  visitor_key text NOT NULL,
  used_on date NOT NULL,
  channel text NOT NULL CHECK (channel IN ('copy', 'chatgpt', 'claude', 'gemini', 'perplexity')),
  PRIMARY KEY (item_type, item_id, visitor_key, used_on, channel)
);

COMMENT ON TABLE public.item_use_events IS
  'One row per visitor, item, channel and day, so a copy or a send counts once. visitor_key is an HMAC under that day''s secret key (prompt_copy_salts), never a user id or an address. Pruned after two days.';

-- No policies: only record_item_use (below) and the prune job touch it.
ALTER TABLE public.item_use_events ENABLE ROW LEVEL SECURITY;

revoke all on public.item_use_events from anon, authenticated;
grant select, insert, update, delete on public.item_use_events to service_role;

-- Adds one to a single count of today's row. Not callable by any browser role;
-- the three counting functions below run as its owner.
CREATE OR REPLACE FUNCTION public.add_to_item_stats(p_item_type text, p_item_id uuid, p_count text)
RETURNS void
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.item_stats_daily AS s
    (item_type, item_id, day, views, copies,
     sends_chatgpt, sends_claude, sends_gemini, sends_perplexity, clicks)
  VALUES (
    p_item_type, p_item_id, current_date,
    (p_count = 'views')::int,
    (p_count = 'copies')::int,
    (p_count = 'chatgpt')::int,
    (p_count = 'claude')::int,
    (p_count = 'gemini')::int,
    (p_count = 'perplexity')::int,
    (p_count = 'clicks')::int
  )
  ON CONFLICT (item_type, item_id, day) DO UPDATE SET
    views = s.views + excluded.views,
    copies = s.copies + excluded.copies,
    sends_chatgpt = s.sends_chatgpt + excluded.sends_chatgpt,
    sends_claude = s.sends_claude + excluded.sends_claude,
    sends_gemini = s.sends_gemini + excluded.sends_gemini,
    sends_perplexity = s.sends_perplexity + excluded.sends_perplexity,
    clicks = s.clicks + excluded.clicks;
$$;

REVOKE ALL ON FUNCTION public.add_to_item_stats(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_to_item_stats(text, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.add_to_item_stats(text, uuid, text) FROM authenticated;

CREATE OR REPLACE FUNCTION public.record_item_use(p_item_type text, p_item_id uuid, p_channel text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $fn$
DECLARE
  v_channel text;
  v_who text;
  v_ip inet;
  v_salt bytea;
  v_key text;
BEGIN
  IF p_item_type IS NULL OR p_item_type NOT IN ('prompt', 'skill', 'workflow', 'prompt_kit')
     OR p_channel IS NULL OR p_channel NOT IN ('copy', 'download', 'chatgpt', 'claude', 'gemini', 'perplexity') THEN
    RETURN;
  END IF;
  IF NOT public.is_item_public(p_item_type, p_item_id) THEN
    RETURN;
  END IF;
  IF auth.uid() IS NOT NULL AND public.is_item_owner(p_item_type, p_item_id, auth.uid()) THEN
    RETURN;
  END IF;

  -- The visitor key of record_prompt_copy (20261007120900), unchanged.
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
  v_key := encode(hmac(convert_to(v_who, 'UTF8'), v_salt, 'sha256'), 'hex');

  v_channel := CASE WHEN p_channel IN ('copy', 'download') THEN 'copy' ELSE p_channel END;
  INSERT INTO public.item_use_events (item_type, item_id, visitor_key, used_on, channel)
  VALUES (p_item_type, p_item_id, v_key, current_date, v_channel)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN
    PERFORM public.add_to_item_stats(
      p_item_type, p_item_id,
      CASE WHEN v_channel = 'copy' THEN 'copies' ELSE v_channel END);
  END IF;

  -- copies_count counts as it did before #48: a copy or a send, once per
  -- visitor, prompt and day; a download never.
  IF p_item_type = 'prompt' AND p_channel <> 'download' THEN
    INSERT INTO public.prompt_copy_events (prompt_id, visitor_key, copied_on)
    VALUES (p_item_id, v_key, current_date)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN
      UPDATE public.prompts SET copies_count = coalesce(copies_count, 0) + 1
       WHERE id = p_item_id;
    END IF;
  END IF;
END;
$fn$;

-- Callable by signed-out visitors on purpose (tests/security/28).
REVOKE ALL ON FUNCTION public.record_item_use(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_item_use(text, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.record_item_use(text, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_item_use(text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_item_use(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_item_use(text, uuid, text) TO service_role;

-- Same signature, so browsers still holding an older bundle keep counting.
CREATE OR REPLACE FUNCTION public.record_prompt_copy(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $fn$
BEGIN
  PERFORM public.record_item_use('prompt', p_prompt_id, 'copy');
END;
$fn$;

-- Callable by signed-out visitors on purpose (tests/security/28).
REVOKE ALL ON FUNCTION public.record_prompt_copy(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_prompt_copy(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.record_prompt_copy(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_prompt_copy(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_prompt_copy(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_prompt_copy(uuid) TO service_role;

-- The bot pattern is BOT_USER_AGENT_PATTERN in src/lib/itemStats.ts, word for
-- word; tests/web/data_itemStats_test.ts fails when the two differ.
CREATE OR REPLACE FUNCTION public.record_item_view(p_item_type text, p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_agent text;
BEGIN
  IF p_item_type IS NULL OR p_item_type NOT IN ('prompt', 'skill', 'workflow', 'prompt_kit') THEN
    RETURN;
  END IF;
  IF NOT public.is_item_public(p_item_type, p_item_id) THEN
    RETURN;
  END IF;
  IF auth.uid() IS NOT NULL AND public.is_item_owner(p_item_type, p_item_id, auth.uid()) THEN
    RETURN;
  END IF;
  BEGIN
    v_agent := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb
                 ->> 'user-agent';
  EXCEPTION WHEN others THEN
    v_agent := NULL;
  END;
  IF coalesce(v_agent, '') = ''
     OR v_agent ~* 'bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|embedly|preview|curl|wget|python|httpclient|okhttp|go-http-client|java/|libwww|scrapy|axios|node-fetch|phantomjs|selenium|puppeteer|playwright' THEN
    RETURN;
  END IF;
  PERFORM public.add_to_item_stats(p_item_type, p_item_id, 'views');
END;
$fn$;

-- Callable by signed-out visitors on purpose (tests/security/28).
REVOKE ALL ON FUNCTION public.record_item_view(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_item_view(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.record_item_view(text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_item_view(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_item_view(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_item_view(text, uuid) TO service_role;

-- As in 20261119120000, and the click also goes into the day's row.
CREATE OR REPLACE FUNCTION public.follow_creator_link(p_item_id uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_url text;
  v_type text;
BEGIN
  UPDATE public.creator_links l
     SET click_count = l.click_count + 1
   WHERE l.item_id = p_item_id
     AND l.status = 'approved'
     AND public.is_item_public(l.item_type, l.item_id)
  RETURNING l.url, l.item_type INTO v_url, v_type;
  IF v_url IS NOT NULL THEN
    PERFORM public.add_to_item_stats(v_type, p_item_id, 'clicks');
  END IF;
  RETURN v_url;
END;
$fn$;

REVOKE ALL ON FUNCTION public.follow_creator_link(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.follow_creator_link(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.follow_creator_link(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.follow_creator_link(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.follow_creator_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.follow_creator_link(uuid) TO service_role;

-- What an item owns goes with it. Runs as its owner so a deletion by
-- service_role or an admin removes the rows no browser role can see.
CREATE OR REPLACE FUNCTION public.delete_item_stats_of_artifact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_type text := CASE TG_TABLE_NAME
                   WHEN 'prompts'     THEN 'prompt'
                   WHEN 'skills'      THEN 'skill'
                   WHEN 'workflows'   THEN 'workflow'
                   WHEN 'prompt_kits' THEN 'prompt_kit'
                 END;
BEGIN
  DELETE FROM public.item_stats_daily WHERE item_type = v_type AND item_id = OLD.id;
  DELETE FROM public.item_use_events WHERE item_type = v_type AND item_id = OLD.id;
  RETURN OLD;
END;
$fn$;

REVOKE ALL ON FUNCTION public.delete_item_stats_of_artifact() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_item_stats_of_artifact() FROM anon;
REVOKE ALL ON FUNCTION public.delete_item_stats_of_artifact() FROM authenticated;

DROP TRIGGER IF EXISTS delete_item_stats ON public.prompts;
CREATE TRIGGER delete_item_stats
  AFTER DELETE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.delete_item_stats_of_artifact();

DROP TRIGGER IF EXISTS delete_item_stats ON public.skills;
CREATE TRIGGER delete_item_stats
  AFTER DELETE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.delete_item_stats_of_artifact();

DROP TRIGGER IF EXISTS delete_item_stats ON public.workflows;
CREATE TRIGGER delete_item_stats
  AFTER DELETE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.delete_item_stats_of_artifact();

DROP TRIGGER IF EXISTS delete_item_stats ON public.prompt_kits;
CREATE TRIGGER delete_item_stats
  AFTER DELETE ON public.prompt_kits
  FOR EACH ROW EXECUTE FUNCTION public.delete_item_stats_of_artifact();

-- The use events go on the day their key does (prune-prompt-copy-events drops
-- the salts older than yesterday); the daily counts after 400 days.
SELECT cron.schedule(
  'prune-item-stats',
  '35 12 * * *',
  $$DELETE FROM public.item_use_events WHERE used_on < current_date - 1;
    DELETE FROM public.item_stats_daily WHERE day <= current_date - 400$$
);
