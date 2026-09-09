-- Findings 4 and 6 of the 2026-09-08 audit.
--
-- menerio_sync_queue let a user insert any artifact id as long as user_id was
-- their own. The worker then loaded that artifact with the service role and
-- posted its full content to the Menerio host the caller had registered. So a
-- stranger's private prompt could be pulled out through the sync queue. The
-- policy now checks the artifact belongs to the caller; the worker checks it
-- again before sending.
--
-- moderation_review_queue had a user INSERT policy nothing in the app uses
-- (only the moderate-content function inserts, with the service role). Each
-- row costs a paid AI call, so the policy was an open tap. It goes.
--
-- ai_insights let any signed-in user write the insights shown on someone
-- else's public artifact, and the unique key on (item_type, item_id) meant the
-- first writer won until the owner regenerated. Writing now needs the same
-- right as changing or deleting one, which is owner or admin. The panel hides
-- the control for everyone else, so nobody spends credits on a call whose
-- result the database then refuses.

DROP POLICY IF EXISTS "Users can insert own sync queue entries" ON public.menerio_sync_queue;
CREATE POLICY "Users can insert own sync queue entries" ON public.menerio_sync_queue
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_item_owner(artifact_type, artifact_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own queue items" ON public.moderation_review_queue;

DROP POLICY IF EXISTS "Users can create insights for accessible items" ON public.ai_insights;
CREATE POLICY "Item owners can create insights" ON public.ai_insights
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_item_owner(item_type, item_id, auth.uid())
    OR public.is_admin(auth.uid())
  );
