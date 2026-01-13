-- Add new columns for Antigravity-style markdown workflows
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS filename text,
ADD COLUMN IF NOT EXISTS scope text DEFAULT 'workspace';

-- Add check constraint for scope
ALTER TABLE public.workflows
ADD CONSTRAINT workflows_scope_check CHECK (scope IN ('workspace', 'global'));

-- Migrate existing JSON data to content column (stringify the JSON)
UPDATE public.workflows
SET content = json::text
WHERE content IS NULL AND json IS NOT NULL;

-- Generate default filenames from existing slugs
UPDATE public.workflows
SET filename = slug || '.md'
WHERE filename IS NULL AND slug IS NOT NULL;

-- Make content required for new rows (but allow NULL for migration)
COMMENT ON COLUMN public.workflows.content IS 'Markdown content for Antigravity workflows';
COMMENT ON COLUMN public.workflows.filename IS 'Filename for the workflow (e.g., my-workflow.md)';
COMMENT ON COLUMN public.workflows.scope IS 'Scope: workspace or global';