-- Every AI call in Querino hardcoded its model and its system prompt, so
-- changing either one was a deploy. This makes them a row.
--
-- A missing row, or a row with enabled = false, means "use the code default".
-- The feature is therefore inert until an administrator touches it, and turning
-- a row off is always a safe way back.
--
-- `tier` is here on day one even though per-tier configuration is not built and
-- may never be. It is the one part of that feature that is expensive to add
-- later: it is in the primary key. With the column present, switching tiering on
-- is a control in the panel and nothing else.

CREATE TABLE public.llm_call_configs (
  call_site     TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'default',
  description   TEXT,
  provider      TEXT NOT NULL DEFAULT 'lovable',
  model         TEXT NOT NULL,
  system_prompt TEXT,
  temperature   NUMERIC,
  max_tokens    INTEGER,
  extra_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  updated_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (call_site, tier),
  CONSTRAINT llm_call_configs_provider_chk
    CHECK (provider IN ('lovable','openrouter','openai','anthropic','gemini')),
  CONSTRAINT llm_call_configs_tier_chk
    CHECK (tier IN ('default','free','premium'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.llm_call_configs TO authenticated;
GRANT ALL ON public.llm_call_configs TO service_role;

ALTER TABLE public.llm_call_configs ENABLE ROW LEVEL SECURITY;

-- Admins only, both ways. No policy for anon: the anon key ships in the browser
-- bundle, and a system prompt is not something to hand out with it.
CREATE POLICY "Admins can read llm_call_configs"
  ON public.llm_call_configs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can write llm_call_configs"
  ON public.llm_call_configs
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_llm_call_configs_updated_at
BEFORE UPDATE ON public.llm_call_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- All 17 seed at tier 'default' with exactly what the code does today, and a
-- NULL system_prompt meaning "use the code default", so applying this changes
-- no behaviour at all.
INSERT INTO public.llm_call_configs (call_site, description, provider, model, system_prompt, enabled)
VALUES
  ('prompt-coach',               'Chat coach that helps a user write a prompt.',                  'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('prompt-kit-coach',           'Chat coach that helps a user write a prompt kit.',              'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('skill-coach',                'Chat coach that helps a user write a skill.',                   'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('workflow-coach',             'Chat coach that helps a user write a workflow.',                'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-metadata',           'Suggests title, description and tags for a prompt.',            'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-promptkit-metadata', 'Suggests title, description and tags for a prompt kit.',        'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-skill-metadata',     'Suggests title, description and tags for a skill.',             'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('suggest-workflow-metadata',  'Suggests title, description and tags for a workflow.',          'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-prompt',         'Generates the AI insights shown on a prompt page.',             'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-skill',          'Generates the AI insights shown on a skill page.',              'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-workflow',       'Generates the AI insights shown on a workflow page.',           'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-insights-prompt_kit',     'Generates the AI insights shown on a prompt kit page.',         'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('prompt-wizard',              'The guided wizard that builds a prompt from answers.',          'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('prompt-refinement',          'Refines an existing prompt on request.',                        'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('translate-artifact',         'Translates an artifact into another language.',                 'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('canvas-ai',                  'The canvas assistant that edits an artifact in place.',         'lovable', 'google/gemini-3-flash-preview', NULL, true),
  ('ai-moderate-content',        'Classifies queued user content against the content policies.',  'lovable', 'google/gemini-3-flash-preview', NULL, true)
ON CONFLICT (call_site, tier) DO NOTHING;
