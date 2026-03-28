
-- Create menerio_integration table
CREATE TABLE public.menerio_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  menerio_api_key text NOT NULL,
  menerio_base_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  auto_sync boolean NOT NULL DEFAULT true,
  sync_artifact_types text[] NOT NULL DEFAULT '{prompt,skill,claw,workflow}',
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menerio_integration ENABLE ROW LEVEL SECURITY;

-- Users can read their own entry
CREATE POLICY "Users can view own menerio integration"
  ON public.menerio_integration FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own entry
CREATE POLICY "Users can insert own menerio integration"
  ON public.menerio_integration FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entry
CREATE POLICY "Users can update own menerio integration"
  ON public.menerio_integration FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own entry
CREATE POLICY "Users can delete own menerio integration"
  ON public.menerio_integration FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_menerio_integration_updated_at
  BEFORE UPDATE ON public.menerio_integration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
