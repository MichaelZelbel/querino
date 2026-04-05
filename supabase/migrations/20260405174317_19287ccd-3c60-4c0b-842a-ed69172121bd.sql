
-- Create moderation_review_queue table
CREATE TABLE public.moderation_review_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content_snapshot text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  ai_category text,
  ai_confidence double precision,
  ai_reason text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.moderation_review_queue ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own queue items
CREATE POLICY "Users can insert own queue items"
  ON public.moderation_review_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all queue items
CREATE POLICY "Admins can view queue items"
  ON public.moderation_review_queue
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins can update queue items
CREATE POLICY "Admins can update queue items"
  ON public.moderation_review_queue
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins can delete queue items
CREATE POLICY "Admins can delete queue items"
  ON public.moderation_review_queue
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access on moderation_review_queue"
  ON public.moderation_review_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for pending items processing
CREATE INDEX idx_moderation_review_queue_status ON public.moderation_review_queue (status) WHERE status = 'pending';

-- Add tier column to moderation_events
ALTER TABLE public.moderation_events ADD COLUMN tier text NOT NULL DEFAULT 'stopword';
