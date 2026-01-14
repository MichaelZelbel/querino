-- Delete specific orphan prompts by slug
DELETE FROM prompts 
WHERE slug IN ('professional-email-writer', 'tell-me-my-weather', 'example-promt-v2')
AND author_id IS NULL;