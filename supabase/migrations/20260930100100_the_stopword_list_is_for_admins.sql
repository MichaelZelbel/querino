-- The moderation stopword list is readable by admins only (2026-09-30 audit).
--
-- What was wrong. 20260404172836 created moderation_stopwords with the policy
-- "Authenticated users can view stopwords" USING (true), so every signed-in
-- account, and a free signup is one click away, could download the complete
-- list of words the first moderation pass blocks, with its categories and
-- severities. That is the list someone needs to write text that passes the
-- filter by construction.
--
-- How it was measured. Rehearsed on production as a signed-in non-admin: the
-- SELECT returned all 75 rows. Every reader of the table was then traced: the
-- admin panel (src/components/admin/ModerationPanel.tsx, admins only) and the
-- moderate-content edge function, which reads it with the service role and so
-- is not subject to row-level security. Nothing else reads it.
--
-- What it changes. The SELECT policy becomes admins only, like the insert,
-- update and delete policies beside it. The admin panel and moderate-content
-- read exactly what they read before.

DROP POLICY IF EXISTS "Authenticated users can view stopwords" ON public.moderation_stopwords;
DROP POLICY IF EXISTS "Admins can view stopwords" ON public.moderation_stopwords;
CREATE POLICY "Admins can view stopwords"
  ON public.moderation_stopwords
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
