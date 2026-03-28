
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS menerio_synced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS menerio_note_id text,
  ADD COLUMN IF NOT EXISTS menerio_synced_at timestamptz;

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS menerio_synced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS menerio_note_id text,
  ADD COLUMN IF NOT EXISTS menerio_synced_at timestamptz;

ALTER TABLE public.claws
  ADD COLUMN IF NOT EXISTS menerio_synced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS menerio_note_id text,
  ADD COLUMN IF NOT EXISTS menerio_synced_at timestamptz;

ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS menerio_synced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS menerio_note_id text,
  ADD COLUMN IF NOT EXISTS menerio_synced_at timestamptz;
