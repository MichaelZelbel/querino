-- Create comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'skill', 'workflow', 'collection')),
  item_id uuid NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  edited boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is team member for an artefact
CREATE OR REPLACE FUNCTION public.is_team_member_for_item(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Get team_id based on item type
  IF p_item_type = 'prompt' THEN
    SELECT team_id INTO v_team_id FROM prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT team_id INTO v_team_id FROM skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT team_id INTO v_team_id FROM workflows WHERE id = p_item_id;
  ELSIF p_item_type = 'collection' THEN
    SELECT team_id INTO v_team_id FROM collections WHERE id = p_item_id;
  END IF;

  -- If no team, return true (public access)
  IF v_team_id IS NULL THEN
    RETURN true;
  END IF;

  -- Check if user is team member
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = v_team_id AND user_id = p_user_id
  );
END;
$$;

-- Helper function to check if item is public
CREATE OR REPLACE FUNCTION public.is_item_public(p_item_type text, p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_public boolean;
  v_team_id uuid;
BEGIN
  IF p_item_type = 'prompt' THEN
    SELECT is_public, team_id INTO v_is_public, v_team_id FROM prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT published, team_id INTO v_is_public, v_team_id FROM skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT published, team_id INTO v_is_public, v_team_id FROM workflows WHERE id = p_item_id;
  ELSIF p_item_type = 'collection' THEN
    SELECT is_public, team_id INTO v_is_public, v_team_id FROM collections WHERE id = p_item_id;
  END IF;

  -- Team items are never "public" in this context
  IF v_team_id IS NOT NULL THEN
    RETURN false;
  END IF;

  RETURN COALESCE(v_is_public, false);
END;
$$;

-- RLS Policies

-- Anyone can read comments on public items
CREATE POLICY "Anyone can read comments on public items"
ON public.comments
FOR SELECT
USING (
  public.is_item_public(item_type, item_id) = true
);

-- Team members can read comments on team items
CREATE POLICY "Team members can read team item comments"
ON public.comments
FOR SELECT
USING (
  public.is_team_member_for_item(item_type, item_id, auth.uid()) = true
  AND public.is_item_public(item_type, item_id) = false
);

-- Logged-in users can create comments on public items
CREATE POLICY "Users can create comments on public items"
ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.is_item_public(item_type, item_id) = true
);

-- Team members can create comments on team items
CREATE POLICY "Team members can create comments on team items"
ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.is_team_member_for_item(item_type, item_id, auth.uid()) = true
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_comments_item ON public.comments(item_type, item_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.edited = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_comments_updated_at();