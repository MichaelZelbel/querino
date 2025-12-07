-- Create prompt_reviews table
CREATE TABLE public.prompt_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, user_id)
);

-- Enable RLS
ALTER TABLE public.prompt_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
ON public.prompt_reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.prompt_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.prompt_reviews
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.prompt_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update prompt rating stats
CREATE OR REPLACE FUNCTION public.update_prompt_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_prompt_id UUID;
  new_avg NUMERIC;
  new_count INTEGER;
BEGIN
  -- Determine which prompt_id to update
  IF TG_OP = 'DELETE' THEN
    target_prompt_id := OLD.prompt_id;
  ELSE
    target_prompt_id := NEW.prompt_id;
  END IF;

  -- Calculate new stats
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO new_avg, new_count
  FROM public.prompt_reviews
  WHERE prompt_id = target_prompt_id;

  -- Update the prompts table
  UPDATE public.prompts
  SET 
    rating_avg = new_avg,
    rating_count = new_count
  WHERE id = target_prompt_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_prompt_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.prompt_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_prompt_rating_stats();

-- Create trigger for updated_at
CREATE TRIGGER update_prompt_reviews_updated_at
BEFORE UPDATE ON public.prompt_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_prompts_updated_at();