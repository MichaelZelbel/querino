-- Create the updated_at column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create skill_reviews table
CREATE TABLE public.skill_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(skill_id, user_id)
);

-- Create workflow_reviews table
CREATE TABLE public.workflow_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, user_id)
);

-- Enable RLS
ALTER TABLE public.skill_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_reviews ENABLE ROW LEVEL SECURITY;

-- Skill reviews policies
CREATE POLICY "Anyone can view skill reviews" ON public.skill_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own skill reviews" ON public.skill_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skill reviews" ON public.skill_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skill reviews" ON public.skill_reviews FOR DELETE USING (auth.uid() = user_id);

-- Workflow reviews policies
CREATE POLICY "Anyone can view workflow reviews" ON public.workflow_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own workflow reviews" ON public.workflow_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workflow reviews" ON public.workflow_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workflow reviews" ON public.workflow_reviews FOR DELETE USING (auth.uid() = user_id);

-- Add rating columns to skills table
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 0;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Add rating columns to workflows table
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 0;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create function to update skill ratings
CREATE OR REPLACE FUNCTION public.update_skill_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.skills
    SET rating_avg = COALESCE((SELECT AVG(rating)::numeric FROM public.skill_reviews WHERE skill_id = OLD.skill_id), 0),
        rating_count = (SELECT COUNT(*) FROM public.skill_reviews WHERE skill_id = OLD.skill_id)
    WHERE id = OLD.skill_id;
    RETURN OLD;
  ELSE
    UPDATE public.skills
    SET rating_avg = COALESCE((SELECT AVG(rating)::numeric FROM public.skill_reviews WHERE skill_id = NEW.skill_id), 0),
        rating_count = (SELECT COUNT(*) FROM public.skill_reviews WHERE skill_id = NEW.skill_id)
    WHERE id = NEW.skill_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to update workflow ratings
CREATE OR REPLACE FUNCTION public.update_workflow_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.workflows
    SET rating_avg = COALESCE((SELECT AVG(rating)::numeric FROM public.workflow_reviews WHERE workflow_id = OLD.workflow_id), 0),
        rating_count = (SELECT COUNT(*) FROM public.workflow_reviews WHERE workflow_id = OLD.workflow_id)
    WHERE id = OLD.workflow_id;
    RETURN OLD;
  ELSE
    UPDATE public.workflows
    SET rating_avg = COALESCE((SELECT AVG(rating)::numeric FROM public.workflow_reviews WHERE workflow_id = NEW.workflow_id), 0),
        rating_count = (SELECT COUNT(*) FROM public.workflow_reviews WHERE workflow_id = NEW.workflow_id)
    WHERE id = NEW.workflow_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for skill ratings
CREATE TRIGGER update_skill_rating_on_insert
AFTER INSERT ON public.skill_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_skill_rating();

CREATE TRIGGER update_skill_rating_on_update
AFTER UPDATE ON public.skill_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_skill_rating();

CREATE TRIGGER update_skill_rating_on_delete
AFTER DELETE ON public.skill_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_skill_rating();

-- Create triggers for workflow ratings
CREATE TRIGGER update_workflow_rating_on_insert
AFTER INSERT ON public.workflow_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_workflow_rating();

CREATE TRIGGER update_workflow_rating_on_update
AFTER UPDATE ON public.workflow_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_workflow_rating();

CREATE TRIGGER update_workflow_rating_on_delete
AFTER DELETE ON public.workflow_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_workflow_rating();

-- Create trigger for updated_at on skill_reviews
CREATE TRIGGER update_skill_reviews_updated_at
BEFORE UPDATE ON public.skill_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on workflow_reviews
CREATE TRIGGER update_workflow_reviews_updated_at
BEFORE UPDATE ON public.workflow_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();