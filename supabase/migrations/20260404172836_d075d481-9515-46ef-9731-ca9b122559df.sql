
-- 1. moderation_stopwords
CREATE TABLE public.moderation_stopwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'block',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT moderation_stopwords_word_unique UNIQUE (word)
);

ALTER TABLE public.moderation_stopwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stopwords"
  ON public.moderation_stopwords FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert stopwords"
  ON public.moderation_stopwords FOR INSERT
  TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update stopwords"
  ON public.moderation_stopwords FOR UPDATE
  TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete stopwords"
  ON public.moderation_stopwords FOR DELETE
  TO authenticated USING (is_admin(auth.uid()));

-- 2. moderation_events
CREATE TABLE public.moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  item_type text NOT NULL,
  item_id uuid,
  flagged_content text,
  matched_words text[],
  category text,
  result text NOT NULL DEFAULT 'cleared',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on moderation_events"
  ON public.moderation_events FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view moderation events"
  ON public.moderation_events FOR SELECT
  TO authenticated USING (is_admin(auth.uid()));

-- 3. user_suspensions
CREATE TABLE public.user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strike_count integer NOT NULL DEFAULT 0,
  suspended boolean NOT NULL DEFAULT false,
  suspended_at timestamptz,
  suspended_until timestamptz,
  suspension_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_suspensions_user_unique UNIQUE (user_id)
);

ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suspension"
  ON public.user_suspensions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suspensions"
  ON public.user_suspensions FOR SELECT
  TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert suspensions"
  ON public.user_suspensions FOR INSERT
  TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update suspensions"
  ON public.user_suspensions FOR UPDATE
  TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete suspensions"
  ON public.user_suspensions FOR DELETE
  TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access on user_suspensions"
  ON public.user_suspensions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- updated_at trigger for user_suspensions
CREATE TRIGGER update_user_suspensions_updated_at
  BEFORE UPDATE ON public.user_suspensions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
