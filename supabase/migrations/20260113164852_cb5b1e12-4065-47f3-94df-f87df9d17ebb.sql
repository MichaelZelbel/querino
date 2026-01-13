-- Fix security warnings by setting search_path on functions
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
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_prompt_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND NEW.title != OLD.title) THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'prompts', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_skill_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND NEW.title != OLD.title) THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'skills', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_workflow_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND NEW.title != OLD.title) THEN
    NEW.slug := public.generate_unique_slug(NEW.title, 'workflows', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Make slug column nullable for inserts (trigger will fill it)
ALTER TABLE public.prompts ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE public.skills ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE public.workflows ALTER COLUMN slug DROP NOT NULL;