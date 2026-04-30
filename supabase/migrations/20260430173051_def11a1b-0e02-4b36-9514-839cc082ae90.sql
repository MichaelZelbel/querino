-- Allow ai_insights to store entries for prompt_kit
ALTER TABLE public.ai_insights DROP CONSTRAINT IF EXISTS ai_insights_item_type_check;
ALTER TABLE public.ai_insights ADD CONSTRAINT ai_insights_item_type_check
  CHECK (item_type IN ('prompt', 'skill', 'workflow', 'prompt_kit'));