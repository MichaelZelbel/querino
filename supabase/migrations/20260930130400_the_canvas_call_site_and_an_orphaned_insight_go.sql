-- Two rows that belong to nothing any more (2026-09-30, Michael's decisions
-- after the audit of the same day).
--
-- 1. The canvas-ai edge function was deleted: the coaches replaced it and it
--    was never called (0 usage events ever). Its configuration row in
--    llm_call_configs would otherwise sit in the admin panel as a setting for
--    nothing. Its usage history is kept; there is none.
-- 2. One AI insight whose prompt was deleted before 20260930100800 made a
--    deleted artifact take its insights with it. Measured: exactly 1 such row,
--    of 9 insights.

DELETE FROM public.llm_call_configs WHERE call_site = 'canvas-ai';

DELETE FROM public.ai_insights i
 WHERE (i.item_type = 'prompt'     AND NOT EXISTS (SELECT 1 FROM public.prompts p     WHERE p.id = i.item_id))
    OR (i.item_type = 'skill'      AND NOT EXISTS (SELECT 1 FROM public.skills s      WHERE s.id = i.item_id))
    OR (i.item_type = 'workflow'   AND NOT EXISTS (SELECT 1 FROM public.workflows w   WHERE w.id = i.item_id))
    OR (i.item_type = 'prompt_kit' AND NOT EXISTS (SELECT 1 FROM public.prompt_kits k WHERE k.id = i.item_id));
