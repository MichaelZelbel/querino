-- The model catalogue remembers itself.
--
-- The provider and model list in llm-registry.ts is a constant somebody typed.
-- It was wrong within three days of being written: on 2026-08-26 the label for
-- deepseek/deepseek-v4-flash said $0.05/$0.10 and OpenRouter said $0.08/$0.15,
-- and the catalogue had grown from 342 models to 417 in a week. A dropdown that
-- exists to show cost, showing a made-up cost, is worse than no dropdown.
--
-- WHY THIS IS A TABLE AND NOT A CACHE. OpenRouter mostly does not announce a
-- retirement. On the day this was written, 9 of 417 models carried an
-- expiration_date and some of those were sentinels like 2098-12-31. A model
-- stops being listed and that is the whole notice. So a retirement can only be
-- found by comparing today's catalogue against yesterday's, which makes this
-- table the memory that makes the nightly check possible at all. Caching is a
-- side effect, not the point.
--
-- Two tables and one job:
--
--   llm_models        what the provider offered, the last time we looked
--   llm_model_alerts  what the nightly comparison found, and what it did
--   sync-llm-models   the job, at 04:20 UTC, so the mail is there at breakfast

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. The catalogue
-- ---------------------------------------------------------------------------

CREATE TABLE public.llm_models (
  provider               TEXT        NOT NULL,
  model_id               TEXT        NOT NULL,
  name                   TEXT        NOT NULL,
  context_length         INTEGER,
  -- Per million tokens. NULL where the provider quotes no fixed price:
  -- openrouter/auto reports -1 per token, which is a sentinel for "depends
  -- what it routes to", not minus a million dollars.
  prompt_price_per_m     NUMERIC,
  completion_price_per_m NUMERIC,
  -- The field worth the whole exercise. Eleven of the seventeen call sites send
  -- a tools array, and a model without support does not error, it answers in
  -- prose and the JSON parse fails downstream.
  supports_tools         BOOLEAN     NOT NULL DEFAULT false,
  input_modalities       TEXT[]      NOT NULL DEFAULT '{}',
  output_modalities      TEXT[]      NOT NULL DEFAULT '{}',
  expiration_date        DATE,
  first_seen_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Set when the model stopped being listed, cleared if it comes back.
  -- OpenRouter does drop and restore ids.
  retired_at             TIMESTAMPTZ,
  raw                    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, model_id)
);

CREATE INDEX llm_models_live_idx
  ON public.llm_models (provider, supports_tools)
  WHERE retired_at IS NULL;

CREATE TRIGGER set_llm_models_updated_at
  BEFORE UPDATE ON public.llm_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.llm_models ENABLE ROW LEVEL SECURITY;

-- Readable by anyone, unlike every other table in this file's neighbourhood.
-- This is a mirror of a catalogue OpenRouter already serves to the public with
-- no API key, so there is nothing here to protect, and the hub and Menerio are
-- meant to read it. Writes are service-role only: no INSERT, UPDATE or DELETE
-- policy exists, so the anon key in every visitor's bundle can look and not
-- touch.
CREATE POLICY "Anyone can read llm_models"
  ON public.llm_models
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.llm_models IS
  'Mirror of a provider''s public model catalogue, refreshed nightly by '
  'sync-llm-models. Deliberately world-readable: it is public data, and it is '
  'the shared list Querino, Menerio and the hub read. Its real job is memory: '
  'a retirement is only detectable by diffing today''s catalogue against this.';

-- ---------------------------------------------------------------------------
-- 2. What the comparison found, and what it did about it
-- ---------------------------------------------------------------------------

CREATE TABLE public.llm_model_alerts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind         TEXT        NOT NULL,
  provider     TEXT,
  model_id     TEXT,
  call_site    TEXT,
  tier         TEXT,
  detail       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  -- What the job changed, in words, so the admin page can say "disabled
  -- automatically on 2026-08-26, google/x was retired" instead of leaving a
  -- switched-off row that looks like somebody turned it off and forgot.
  action_taken TEXT,
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID,
  CONSTRAINT llm_model_alerts_kind_chk CHECK (kind IN (
    'retired',              -- a configured model stopped being listed
    'lost_tool_support',    -- and the call site needs tools
    'code_default_retired', -- the fallback itself is gone; needs a code change
    'sync_failed'           -- the fetch failed or looked implausible
  ))
);

CREATE INDEX llm_model_alerts_unresolved_idx
  ON public.llm_model_alerts (created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.llm_model_alerts ENABLE ROW LEVEL SECURITY;

-- Admins only, both ways. This one names call sites and models the app is
-- configured to use, which is operational detail, not public catalogue data.
CREATE POLICY "Admins can read llm_model_alerts"
  ON public.llm_model_alerts
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can write llm_model_alerts"
  ON public.llm_model_alerts
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

COMMENT ON TABLE public.llm_model_alerts IS
  'What the nightly catalogue sync found and what it changed. Unresolved rows '
  'are the banner on the LLM Config tab.';

-- ---------------------------------------------------------------------------
-- 3. The job
-- ---------------------------------------------------------------------------
--
-- Same shape as the four jobs in 20260821160000 and 20260823120000:
-- internal_job_headers() reads the shared secret from Vault at run time, so no
-- secret lands in this file, and sync-llm-models is verify_jwt = false because
-- these headers carry no bearer token and the gateway would otherwise refuse
-- the call before the function's own guard ever ran.
--
-- 04:20 UTC is 06:20 in Berlin, so a mail about a model that vanished overnight
-- is already in the inbox at breakfast. Not on the hour, because everyone
-- schedules on the hour.

SELECT cron.schedule(
  'sync-llm-models-nightly',
  '20 4 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/sync-llm-models',
    headers := public.internal_job_headers(),
    body    := '{}'::jsonb
  ) AS request_id;
  $job$
);

COMMIT;
