-- Delete test/sample prompts with 100+ reviews and no author
DELETE FROM prompts 
WHERE rating_count >= 100 
AND author_id IS NULL;