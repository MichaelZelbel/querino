-- The Prompt Coach's configuration row is switched back on (2026-09-30 audit).
--
-- What was wrong. On 2026-09-23 at 20:49 UTC two copies of the security suite
-- ran at once and one of them wrote "attacker/expensive-model" into the live
-- prompt-coach row (the 2026-09-23 review tells the story; the suite now takes
-- a lock, 20260923150000). Within seconds sync-llm-models saw a model that is
-- not in the catalogue, switched the row off and opened an alert, which is what
-- it is for. At 20:51 the model was put back, but not the switch, and the alert
-- stayed open. Since then the Prompt Coach has run on the model in the code
-- (the same model, so nobody noticed) and every change made to this row in the
-- admin panel has been ignored.
--
-- How it was measured. llm_call_configs: prompt-coach/default enabled = false,
-- model google/gemini-3.1-flash-lite, updated 2026-09-23 20:51:33. The only
-- alert in llm_model_alerts: prompt-coach, "retired", model
-- attacker/expensive-model, resolved_at NULL.
--
-- What it changes. The row is switched on again, only while it still names
-- the model it was put back to, and that one alert is marked resolved with a
-- note. Spec 18 now restores `enabled` as well as `model` after its writes.

UPDATE public.llm_call_configs
   SET enabled = true
 WHERE call_site = 'prompt-coach'
   AND tier = 'default'
   AND model = 'google/gemini-3.1-flash-lite'
   AND enabled = false;

UPDATE public.llm_model_alerts
   SET resolved_at = now(),
       action_taken = action_taken || ' Resolved 2026-09-30: the model was a test suite''s write, restored on 2026-09-23; the row is switched back on.'
 WHERE call_site = 'prompt-coach'
   AND model_id = 'attacker/expensive-model'
   AND resolved_at IS NULL;
