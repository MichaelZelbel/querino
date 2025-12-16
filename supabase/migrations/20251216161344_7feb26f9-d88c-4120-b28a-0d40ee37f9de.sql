-- Create suggestions table for edit proposals
CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'skill', 'workflow')),
  item_id uuid NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  description text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rejected')),
  reviewer_id uuid REFERENCES public.profiles(id),
  review_comment text
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can view suggestions on public items
CREATE POLICY "Anyone can view suggestions on public items"
ON public.suggestions
FOR SELECT
USING (is_item_public(item_type, item_id) = true);

-- Team members can view suggestions on team items
CREATE POLICY "Team members can view suggestions on team items"
ON public.suggestions
FOR SELECT
USING (
  is_item_public(item_type, item_id) = false 
  AND is_team_member_for_item(item_type, item_id, auth.uid()) = true
);

-- Authenticated users can create suggestions on public items (not their own)
CREATE POLICY "Users can create suggestions on public items"
ON public.suggestions
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND is_item_public(item_type, item_id) = true
);

-- Team members can create suggestions on team items
CREATE POLICY "Team members can create suggestions on team items"
ON public.suggestions
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND is_team_member_for_item(item_type, item_id, auth.uid()) = true
);

-- Authors can update their own open suggestions
CREATE POLICY "Authors can update their own open suggestions"
ON public.suggestions
FOR UPDATE
USING (auth.uid() = author_id AND status = 'open')
WITH CHECK (auth.uid() = author_id AND status = 'open');

-- Authors can delete their own suggestions
CREATE POLICY "Authors can delete their own suggestions"
ON public.suggestions
FOR DELETE
USING (auth.uid() = author_id);

-- Create function to check if user is item owner
CREATE OR REPLACE FUNCTION public.is_item_owner(p_item_type text, p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
BEGIN
  IF p_item_type = 'prompt' THEN
    SELECT author_id INTO v_author_id FROM prompts WHERE id = p_item_id;
  ELSIF p_item_type = 'skill' THEN
    SELECT author_id INTO v_author_id FROM skills WHERE id = p_item_id;
  ELSIF p_item_type = 'workflow' THEN
    SELECT author_id INTO v_author_id FROM workflows WHERE id = p_item_id;
  END IF;
  
  RETURN v_author_id = p_user_id;
END;
$$;

-- Item owners can review (update status) suggestions
CREATE POLICY "Item owners can review suggestions"
ON public.suggestions
FOR UPDATE
USING (is_item_owner(item_type, item_id, auth.uid()) = true)
WITH CHECK (is_item_owner(item_type, item_id, auth.uid()) = true);

-- Create updated_at trigger
CREATE TRIGGER update_suggestions_updated_at
BEFORE UPDATE ON public.suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();