-- Create skills table
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Skills RLS policies
CREATE POLICY "Published skills are viewable by everyone"
ON public.skills FOR SELECT
USING (published = true);

CREATE POLICY "Users can view their own skills"
ON public.skills FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own skills"
ON public.skills FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own skills"
ON public.skills FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own skills"
ON public.skills FOR DELETE
USING (auth.uid() = author_id);

-- Create workflows table
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  json jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Workflows RLS policies
CREATE POLICY "Published workflows are viewable by everyone"
ON public.workflows FOR SELECT
USING (published = true);

CREATE POLICY "Users can view their own workflows"
ON public.workflows FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own workflows"
ON public.workflows FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own workflows"
ON public.workflows FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own workflows"
ON public.workflows FOR DELETE
USING (auth.uid() = author_id);

-- Create updated_at triggers
CREATE TRIGGER update_skills_updated_at
BEFORE UPDATE ON public.skills
FOR EACH ROW
EXECUTE FUNCTION public.update_prompts_updated_at();

CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_prompts_updated_at();