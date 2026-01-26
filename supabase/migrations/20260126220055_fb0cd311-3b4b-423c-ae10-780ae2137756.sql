-- Create ai_credit_settings table for configurable AI credit parameters
CREATE TABLE public.ai_credit_settings (
  key text PRIMARY KEY,
  value_int integer NOT NULL,
  description text NULL,
  CONSTRAINT ai_credit_settings_value_int_positive CHECK (value_int >= 0)
);

-- Enable RLS
ALTER TABLE public.ai_credit_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (public config)
CREATE POLICY "Anyone can read AI credit settings"
  ON public.ai_credit_settings
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE from client (admin only via service role)

-- Insert initial configuration values
INSERT INTO public.ai_credit_settings (key, value_int, description) VALUES
  ('tokens_per_credit', 200, 'Global conversion factor: how many tokens equal 1 AI credit'),
  ('credits_free_per_month', 0, 'Monthly AI credits granted to Free users'),
  ('credits_premium_per_month', 1500, 'Monthly AI credits granted to Premium users');