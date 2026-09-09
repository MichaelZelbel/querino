-- Finding 10 of the 2026-09-08 audit.
--
-- The four review tables were readable with USING (true), so the reviews of
-- a private artifact, text included, were visible to anyone who guessed or
-- learned its id, and anyone could rate a private artifact by id. A review is
-- now visible when the artifact is public, when the reader owns the artifact,
-- or when the reader wrote the review; and it can only be written for an
-- artifact that is public.

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.prompt_reviews;
CREATE POLICY "Reviews are visible with the artifact" ON public.prompt_reviews
  FOR SELECT USING (
    public.is_item_public('prompt', prompt_id)
    OR user_id = auth.uid()
    OR public.is_item_owner('prompt', prompt_id, auth.uid())
  );
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.prompt_reviews;
CREATE POLICY "Users can create their own reviews" ON public.prompt_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_item_public('prompt', prompt_id));

DROP POLICY IF EXISTS "Anyone can view skill reviews" ON public.skill_reviews;
CREATE POLICY "Reviews are visible with the artifact" ON public.skill_reviews
  FOR SELECT USING (
    public.is_item_public('skill', skill_id)
    OR user_id = auth.uid()
    OR public.is_item_owner('skill', skill_id, auth.uid())
  );
DROP POLICY IF EXISTS "Users can create their own skill reviews" ON public.skill_reviews;
CREATE POLICY "Users can create their own skill reviews" ON public.skill_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_item_public('skill', skill_id));

DROP POLICY IF EXISTS "Anyone can view workflow reviews" ON public.workflow_reviews;
CREATE POLICY "Reviews are visible with the artifact" ON public.workflow_reviews
  FOR SELECT USING (
    public.is_item_public('workflow', workflow_id)
    OR user_id = auth.uid()
    OR public.is_item_owner('workflow', workflow_id, auth.uid())
  );
DROP POLICY IF EXISTS "Users can create their own workflow reviews" ON public.workflow_reviews;
CREATE POLICY "Users can create their own workflow reviews" ON public.workflow_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_item_public('workflow', workflow_id));

DROP POLICY IF EXISTS "Anyone can view prompt kit reviews" ON public.prompt_kit_reviews;
CREATE POLICY "Reviews are visible with the artifact" ON public.prompt_kit_reviews
  FOR SELECT USING (
    public.is_item_public('prompt_kit', prompt_kit_id)
    OR user_id = auth.uid()
    OR public.is_item_owner('prompt_kit', prompt_kit_id, auth.uid())
  );
DROP POLICY IF EXISTS "Users can create their own prompt kit reviews" ON public.prompt_kit_reviews;
CREATE POLICY "Users can create their own prompt kit reviews" ON public.prompt_kit_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_item_public('prompt_kit', prompt_kit_id));
