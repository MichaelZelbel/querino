-- Add slug columns to prompts, skills, and workflows tables
ALTER TABLE public.prompts ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE public.skills ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE public.workflows ADD COLUMN slug TEXT UNIQUE;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to generate unique slug with number suffix if needed
CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_title TEXT, p_table TEXT, p_exclude_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  base_slug := public.generate_slug(p_title);
  new_slug := base_slug;
  
  LOOP
    IF p_table = 'prompts' THEN
      SELECT EXISTS(SELECT 1 FROM public.prompts WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'skills' THEN
      SELECT EXISTS(SELECT 1 FROM public.skills WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSIF p_table = 'workflows' THEN
      SELECT EXISTS(SELECT 1 FROM public.workflows WHERE slug = new_slug AND (p_exclude_id IS NULL OR id != p_exclude_id)) INTO slug_exists;
    ELSE
      slug_exists := FALSE;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-generate slugs on insert/update
CREATE OR REPLACE FUNCTION public.set_prompt_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.title != OLD.title THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompts', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_skill_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.title != OLD.title THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'skills', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_workflow_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.title != OLD.title THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'workflows', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create insert trigger for prompts
CREATE TRIGGER set_prompt_slug_on_insert
  BEFORE INSERT ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_prompt_slug();

-- Create update trigger for prompts  
CREATE TRIGGER set_prompt_slug_on_update
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title OR NEW.slug IS NULL)
  EXECUTE FUNCTION public.set_prompt_slug();

-- Create insert trigger for skills
CREATE TRIGGER set_skill_slug_on_insert
  BEFORE INSERT ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.set_skill_slug();

-- Create update trigger for skills
CREATE TRIGGER set_skill_slug_on_update
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title OR NEW.slug IS NULL)
  EXECUTE FUNCTION public.set_skill_slug();

-- Create insert trigger for workflows
CREATE TRIGGER set_workflow_slug_on_insert
  BEFORE INSERT ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workflow_slug();

-- Create update trigger for workflows
CREATE TRIGGER set_workflow_slug_on_update
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title OR NEW.slug IS NULL)
  EXECUTE FUNCTION public.set_workflow_slug();

-- Generate slugs for existing records
UPDATE public.prompts SET slug = public.generate_unique_slug(title, 'prompts', id) WHERE slug IS NULL;
UPDATE public.skills SET slug = public.generate_unique_slug(title, 'skills', id) WHERE slug IS NULL;
UPDATE public.workflows SET slug = public.generate_unique_slug(title, 'workflows', id) WHERE slug IS NULL;

-- Now make slug NOT NULL after populating existing records
ALTER TABLE public.prompts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.skills ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.workflows ALTER COLUMN slug SET NOT NULL;

-- Add indexes for slug lookups
CREATE INDEX idx_prompts_slug ON public.prompts(slug);
CREATE INDEX idx_skills_slug ON public.skills(slug);
CREATE INDEX idx_workflows_slug ON public.workflows(slug);