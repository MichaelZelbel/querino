-- Create AI insights cache table
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'skill', 'workflow')),
  item_id uuid NOT NULL,
  summary text,
  tags jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  quality jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(item_type, item_id)
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Public insights for public artefacts
CREATE POLICY "Anyone can view insights for public items"
ON public.ai_insights FOR SELECT
USING (is_item_public(item_type, item_id) = true);

-- Team members can view team artefact insights
CREATE POLICY "Team members can view team item insights"
ON public.ai_insights FOR SELECT
USING (
  is_item_public(item_type, item_id) = false 
  AND is_team_member_for_item(item_type, item_id, auth.uid()) = true
);

-- Authenticated users can insert insights for items they can access
CREATE POLICY "Users can create insights for accessible items"
ON public.ai_insights FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    is_item_public(item_type, item_id) = true 
    OR is_team_member_for_item(item_type, item_id, auth.uid()) = true
  )
);

-- Users can update insights for accessible items
CREATE POLICY "Users can update insights for accessible items"
ON public.ai_insights FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND (
    is_item_public(item_type, item_id) = true 
    OR is_team_member_for_item(item_type, item_id, auth.uid()) = true
  )
);

-- Users can delete insights for accessible items
CREATE POLICY "Users can delete insights for accessible items"
ON public.ai_insights FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (
    is_item_public(item_type, item_id) = true 
    OR is_team_member_for_item(item_type, item_id, auth.uid()) = true
  )
);

-- Create index for fast lookups
CREATE INDEX idx_ai_insights_item ON public.ai_insights(item_type, item_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_ai_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ai_insights_updated_at
BEFORE UPDATE ON public.ai_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_insights_updated_at();