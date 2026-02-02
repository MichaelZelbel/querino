-- Drop the existing check constraint and recreate it to include 'claw'
ALTER TABLE public.ai_insights DROP CONSTRAINT IF EXISTS ai_insights_item_type_check;

ALTER TABLE public.ai_insights ADD CONSTRAINT ai_insights_item_type_check 
  CHECK (item_type IN ('prompt', 'skill', 'workflow', 'claw'));