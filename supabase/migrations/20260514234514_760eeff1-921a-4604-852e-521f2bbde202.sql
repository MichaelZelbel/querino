
-- 1. Add user_id to coach message tables and tighten policies
ALTER TABLE public.prompt_coach_messages ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.prompt_kit_coach_messages ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_prompt_coach_messages_user ON public.prompt_coach_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_kit_coach_messages_user ON public.prompt_kit_coach_messages(user_id);

DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.prompt_coach_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.prompt_coach_messages;
DROP POLICY IF EXISTS "Authenticated users can delete messages" ON public.prompt_coach_messages;

CREATE POLICY "Users can read own coach messages"
  ON public.prompt_coach_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own coach messages"
  ON public.prompt_coach_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own coach messages"
  ON public.prompt_coach_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can read prompt kit coach messages" ON public.prompt_kit_coach_messages;
DROP POLICY IF EXISTS "Authenticated users can insert prompt kit coach messages" ON public.prompt_kit_coach_messages;
DROP POLICY IF EXISTS "Authenticated users can delete prompt kit coach messages" ON public.prompt_kit_coach_messages;

CREATE POLICY "Users can read own prompt kit coach messages"
  ON public.prompt_kit_coach_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own prompt kit coach messages"
  ON public.prompt_kit_coach_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own prompt kit coach messages"
  ON public.prompt_kit_coach_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 2. Remove world-readable activity events; keep actor + team-member access
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.activity_events;

-- 3. Restrict AI insights writes to item owner (or admin)
DROP POLICY IF EXISTS "Users can update insights for accessible items" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can delete insights for accessible items" ON public.ai_insights;

CREATE POLICY "Item owners can update insights"
  ON public.ai_insights FOR UPDATE TO authenticated
  USING (public.is_item_owner(item_type, item_id, auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_item_owner(item_type, item_id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Item owners can delete insights"
  ON public.ai_insights FOR DELETE TO authenticated
  USING (public.is_item_owner(item_type, item_id, auth.uid()) OR public.is_admin(auth.uid()));
