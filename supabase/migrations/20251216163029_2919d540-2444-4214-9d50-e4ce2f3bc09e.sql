-- Add requested_changes column and update status check constraint on suggestions table

-- First drop the existing check constraint
ALTER TABLE public.suggestions DROP CONSTRAINT IF EXISTS suggestions_status_check;

-- Add new check constraint with 'changes_requested' status
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_status_check 
  CHECK (status IN ('open', 'changes_requested', 'accepted', 'rejected'));

-- Add requested_changes column as jsonb array
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS requested_changes jsonb DEFAULT NULL;