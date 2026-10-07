-- An AI insight is written by the ai-insights function, never by the browser
-- (2026-10-07 review).
--
-- What was wrong. The browser called ai-insights for the text, then upserted
-- the ai_insights row itself (src/hooks/useAIInsights.ts), under policies that
-- let an item's owner INSERT and UPDATE any insight on their own items. So an
-- owner could skip the function and POST an "AI" analysis of their own
-- choosing onto their public prompt, and every visitor read it as Querino's AI
-- review ("Anyone can view insights for public items").
--
-- How it was measured. The policies "Item owners can create insights" and
-- "Item owners can update insights", read from pg_policies. The app writes no
-- other column than the ones the function's answer fills.
--
-- What it changes. From the same day ai-insights reads the item itself,
-- checks the caller may analyse it (its owner, or an admin), and upserts the
-- row with the service role. The browser keeps DELETE, which is how an owner
-- clears an insight before generating a new one, and keeps every read.
-- Applied after the function and the site that call it this way were live.

DROP POLICY IF EXISTS "Item owners can create insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Item owners can update insights" ON public.ai_insights;

REVOKE INSERT, UPDATE ON public.ai_insights FROM anon, authenticated;
