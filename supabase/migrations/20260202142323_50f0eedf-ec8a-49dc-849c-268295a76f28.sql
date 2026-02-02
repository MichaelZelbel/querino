-- Create full-text search index for skills table
CREATE INDEX IF NOT EXISTS skills_search_idx ON public.skills 
USING gin (to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(content, '')
));

-- Create full-text search index for workflows table
CREATE INDEX IF NOT EXISTS workflows_search_idx ON public.workflows 
USING gin (to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(content, '')
));

-- Create full-text search index for claws table
CREATE INDEX IF NOT EXISTS claws_search_idx ON public.claws 
USING gin (to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(content, '')
));