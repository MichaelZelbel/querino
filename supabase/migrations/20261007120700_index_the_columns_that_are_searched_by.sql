-- Indexes for the foreign keys and filters that had none (2026-10-07 review).
--
-- Every table is small today (the largest of these holds 520 rows), so
-- nothing is slow yet and Postgres reads them whole either way. These are the
-- columns that are filtered or joined on every request, or that a cascading
-- delete must search when an account or a team goes: without an index each of
-- those becomes a full scan once the tables grow, and it is cheapest to add
-- them while they are empty.
--   * menerio_sync_queue: queue_menerio_sync deletes by artifact on every
--     edit, and account deletion by user (295,000 full scans so far).
--   * collections.team_id, teams.owner_id, suggestions.author_id and the
--     reviewer of each review table: the team workspace filter and the
--     cascades from a deleted account or team. The reviews' unique indexes
--     lead with the artifact, so they do not serve a search by user.
--   * skills.published and workflows.published: Discover's public filter;
--     prompts already have theirs.

CREATE INDEX IF NOT EXISTS idx_menerio_sync_queue_artifact
  ON public.menerio_sync_queue (artifact_type, artifact_id);
CREATE INDEX IF NOT EXISTS idx_menerio_sync_queue_user_id
  ON public.menerio_sync_queue (user_id);

CREATE INDEX IF NOT EXISTS idx_collections_team_id
  ON public.collections (team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teams_owner_id
  ON public.teams (owner_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_author_id
  ON public.suggestions (author_id);

CREATE INDEX IF NOT EXISTS idx_prompt_reviews_user_id
  ON public.prompt_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_skill_reviews_user_id
  ON public.skill_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_reviews_user_id
  ON public.workflow_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_kit_reviews_user_id
  ON public.prompt_kit_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_skills_published
  ON public.skills (published) WHERE published;
CREATE INDEX IF NOT EXISTS idx_workflows_published
  ON public.workflows (published) WHERE published;
