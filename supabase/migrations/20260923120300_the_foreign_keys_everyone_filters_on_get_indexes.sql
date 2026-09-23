-- Indexes for the columns the app filters on every page load and that had
-- none (2026-09-23 review). Checked against every migration before writing:
--
--   prompts(author_id)        exists (idx_prompts_author_id)
--   prompt_kits(author_id)    exists (prompt_kits_author_id_idx)
--   prompt_kits(team_id)      exists (prompt_kits_team_id_idx)
--   team_members(team_id)     covered by UNIQUE (team_id, user_id)
--   prompt_coach_messages     covered by prompt_coach_messages_session_idx
--                             (user_id, session_id, id), which loadHistory's
--                             newest-first read walks backwards
--
-- and missing, so added here:
--
--   skills(author_id), workflows(author_id)
--       "my library" and every RLS check that compares author_id to
--       auth.uid(). Without them each is a sequential scan of the table.
--   prompts(team_id), skills(team_id), workflows(team_id)
--       the team library, and the team RLS policies (team_id IN (...)).
--   team_members(user_id)
--       is_team_member() and every "team_id IN (SELECT team_id FROM
--       team_members WHERE user_id = auth.uid())" in the artifact policies.
--       The unique index leads with team_id, so it cannot serve this.
--   github_sync_state(target_scope, target_id)
--       github-sync reads a target's whole state after a manual sync, and
--       deleteUserData removes it by target. The unique index leads with
--       artifact_type, so it cannot serve either.
--
-- The tables are small (the product data was 15 MB on 2026-09-11), so a plain
-- CREATE INDEX inside the migration's transaction holds its lock for moments.

CREATE INDEX IF NOT EXISTS idx_skills_author_id
  ON public.skills (author_id);
CREATE INDEX IF NOT EXISTS idx_workflows_author_id
  ON public.workflows (author_id);

CREATE INDEX IF NOT EXISTS idx_prompts_team_id
  ON public.prompts (team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_skills_team_id
  ON public.skills (team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_team_id
  ON public.workflows (team_id) WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_user_id
  ON public.team_members (user_id);

CREATE INDEX IF NOT EXISTS idx_github_sync_state_target
  ON public.github_sync_state (target_scope, target_id);
