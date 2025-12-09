-- Create a functional index for full-text search on prompts
CREATE INDEX prompts_search_idx
ON prompts
USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(content, '')));