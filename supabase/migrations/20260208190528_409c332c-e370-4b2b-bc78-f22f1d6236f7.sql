-- Add skill source fields to claws table
-- These fields support inline and remote (GitHub/ClawHub) skill definitions

-- Skill source type: inline, github, or clawhub
ALTER TABLE public.claws
ADD COLUMN skill_source_type text NOT NULL DEFAULT 'inline'
CHECK (skill_source_type IN ('inline', 'github', 'clawhub'));

-- Remote reference (GitHub URL or ClawHub identifier)
ALTER TABLE public.claws
ADD COLUMN skill_source_ref text;

-- Folder path inside repository (for GitHub)
ALTER TABLE public.claws
ADD COLUMN skill_source_path text;

-- Version pinning (latest, tag, or commit SHA)
ALTER TABLE public.claws
ADD COLUMN skill_source_version text;

-- Editable SKILL.md content (for inline or imported skills)
ALTER TABLE public.claws
ADD COLUMN skill_md_content text;

-- Read-only cached SKILL.md content (for remote skills)
ALTER TABLE public.claws
ADD COLUMN skill_md_cached text;

-- Add comment for documentation
COMMENT ON COLUMN public.claws.skill_source_type IS 'Source type for skill definition: inline, github, or clawhub';
COMMENT ON COLUMN public.claws.skill_source_ref IS 'Remote reference: GitHub URL or ClawHub identifier';
COMMENT ON COLUMN public.claws.skill_source_path IS 'Folder path inside repository (GitHub only)';
COMMENT ON COLUMN public.claws.skill_source_version IS 'Version pinning: latest, tag, or commit SHA';
COMMENT ON COLUMN public.claws.skill_md_content IS 'Editable SKILL.md content (inline or imported)';
COMMENT ON COLUMN public.claws.skill_md_cached IS 'Read-only cached SKILL.md content (remote skills)';