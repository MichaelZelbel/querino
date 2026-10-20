-- Restates, for every table, view and sequence in public, exactly the
-- privileges anon, authenticated and service_role hold on the live project
-- (zvuwkffneqxqsihlnfsd) on 2026-10-20, column grants included.
--
-- Why: on 2026-10-30 Supabase stops granting new relations in public to those
-- three roles. Most of the 60 relations below got their grants from the old
-- automatic default, so a rebuild from these migrations (local reset, preview
-- branch, disaster recovery) would leave them with none, or with the default's
-- full grant where live deliberately has less (menerio_integration, profiles,
-- user_credentials, security_suite_lock, prompt_copy_events, prompt_copy_salts).
--
-- Generated from the live ACLs, not written by hand. Every privilege a role
-- holds is granted and every privilege it lacks is revoked, so on the live
-- project this changes nothing: a GRANT of a held privilege and a REVOKE of a
-- missing one are no-ops. Column grants come after the table statements,
-- because revoking a table privilege also revokes it on each column.
-- Applied to live in one transaction that compared the ACLs before and after
-- and would have rolled back on any difference.

-- table activity_events
grant select, insert, update, delete on public.activity_events to anon;
revoke truncate, references, trigger on public.activity_events from anon;
grant select, insert, update, delete on public.activity_events to authenticated;
revoke truncate, references, trigger on public.activity_events from authenticated;
grant all on public.activity_events to service_role;

-- table admin_allowance_adjustments
revoke select, insert, update, delete, truncate, references, trigger on public.admin_allowance_adjustments from anon;
grant select on public.admin_allowance_adjustments to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.admin_allowance_adjustments from authenticated;
grant all on public.admin_allowance_adjustments to service_role;

-- table ai_allowance_periods
grant select, insert, update, delete on public.ai_allowance_periods to anon;
revoke truncate, references, trigger on public.ai_allowance_periods from anon;
grant select, insert, update, delete on public.ai_allowance_periods to authenticated;
revoke truncate, references, trigger on public.ai_allowance_periods from authenticated;
grant all on public.ai_allowance_periods to service_role;

-- table ai_credit_settings
grant select, insert, update, delete on public.ai_credit_settings to anon;
revoke truncate, references, trigger on public.ai_credit_settings from anon;
grant select, insert, update, delete on public.ai_credit_settings to authenticated;
revoke truncate, references, trigger on public.ai_credit_settings from authenticated;
grant all on public.ai_credit_settings to service_role;

-- table ai_insights
grant select, delete on public.ai_insights to anon;
revoke insert, update, truncate, references, trigger on public.ai_insights from anon;
grant select, delete on public.ai_insights to authenticated;
revoke insert, update, truncate, references, trigger on public.ai_insights from authenticated;
grant all on public.ai_insights to service_role;

-- table blog_categories
grant select, insert, update, delete on public.blog_categories to anon;
revoke truncate, references, trigger on public.blog_categories from anon;
grant select, insert, update, delete on public.blog_categories to authenticated;
revoke truncate, references, trigger on public.blog_categories from authenticated;
grant all on public.blog_categories to service_role;

-- table blog_media
grant select, insert, update, delete on public.blog_media to anon;
revoke truncate, references, trigger on public.blog_media from anon;
grant select, insert, update, delete on public.blog_media to authenticated;
revoke truncate, references, trigger on public.blog_media from authenticated;
grant all on public.blog_media to service_role;

-- table blog_post_categories
grant select, insert, update, delete on public.blog_post_categories to anon;
revoke truncate, references, trigger on public.blog_post_categories from anon;
grant select, insert, update, delete on public.blog_post_categories to authenticated;
revoke truncate, references, trigger on public.blog_post_categories from authenticated;
grant all on public.blog_post_categories to service_role;

-- table blog_post_revisions
grant select, insert, update, delete on public.blog_post_revisions to anon;
revoke truncate, references, trigger on public.blog_post_revisions from anon;
grant select, insert, update, delete on public.blog_post_revisions to authenticated;
revoke truncate, references, trigger on public.blog_post_revisions from authenticated;
grant all on public.blog_post_revisions to service_role;

-- table blog_post_tags
grant select, insert, update, delete on public.blog_post_tags to anon;
revoke truncate, references, trigger on public.blog_post_tags from anon;
grant select, insert, update, delete on public.blog_post_tags to authenticated;
revoke truncate, references, trigger on public.blog_post_tags from authenticated;
grant all on public.blog_post_tags to service_role;

-- table blog_posts
grant select, insert, update, delete on public.blog_posts to anon;
revoke truncate, references, trigger on public.blog_posts from anon;
grant select, insert, update, delete on public.blog_posts to authenticated;
revoke truncate, references, trigger on public.blog_posts from authenticated;
grant all on public.blog_posts to service_role;

-- table blog_tags
grant select, insert, update, delete on public.blog_tags to anon;
revoke truncate, references, trigger on public.blog_tags from anon;
grant select, insert, update, delete on public.blog_tags to authenticated;
revoke truncate, references, trigger on public.blog_tags from authenticated;
grant all on public.blog_tags to service_role;

-- table collection_items
grant select, insert, update, delete on public.collection_items to anon;
revoke truncate, references, trigger on public.collection_items from anon;
grant select, insert, update, delete on public.collection_items to authenticated;
revoke truncate, references, trigger on public.collection_items from authenticated;
grant all on public.collection_items to service_role;

-- table collections
grant select, insert, update, delete on public.collections to anon;
revoke truncate, references, trigger on public.collections from anon;
grant select, insert, update, delete on public.collections to authenticated;
revoke truncate, references, trigger on public.collections from authenticated;
grant all on public.collections to service_role;

-- table comments
grant select, insert, update, delete on public.comments to anon;
revoke truncate, references, trigger on public.comments from anon;
grant select, insert, update, delete on public.comments to authenticated;
revoke truncate, references, trigger on public.comments from authenticated;
grant all on public.comments to service_role;

-- table github_sync_queue
grant select, insert, update, delete on public.github_sync_queue to anon;
revoke truncate, references, trigger on public.github_sync_queue from anon;
grant select, insert, update, delete on public.github_sync_queue to authenticated;
revoke truncate, references, trigger on public.github_sync_queue from authenticated;
grant all on public.github_sync_queue to service_role;

-- table github_sync_state
grant select, insert, update, delete on public.github_sync_state to anon;
revoke truncate, references, trigger on public.github_sync_state from anon;
grant select, insert, update, delete on public.github_sync_state to authenticated;
revoke truncate, references, trigger on public.github_sync_state from authenticated;
grant all on public.github_sync_state to service_role;

-- table llm_call_configs
grant select, insert, update, delete on public.llm_call_configs to anon;
revoke truncate, references, trigger on public.llm_call_configs from anon;
grant select, insert, update, delete on public.llm_call_configs to authenticated;
revoke truncate, references, trigger on public.llm_call_configs from authenticated;
grant all on public.llm_call_configs to service_role;

-- table llm_model_alerts
grant select, insert, update, delete on public.llm_model_alerts to anon;
revoke truncate, references, trigger on public.llm_model_alerts from anon;
grant select, insert, update, delete on public.llm_model_alerts to authenticated;
revoke truncate, references, trigger on public.llm_model_alerts from authenticated;
grant all on public.llm_model_alerts to service_role;

-- table llm_models
grant select, insert, update, delete on public.llm_models to anon;
revoke truncate, references, trigger on public.llm_models from anon;
grant select, insert, update, delete on public.llm_models to authenticated;
revoke truncate, references, trigger on public.llm_models from authenticated;
grant all on public.llm_models to service_role;

-- table llm_usage_events
grant select, insert, update, delete on public.llm_usage_events to anon;
revoke truncate, references, trigger on public.llm_usage_events from anon;
grant select, insert, update, delete on public.llm_usage_events to authenticated;
revoke truncate, references, trigger on public.llm_usage_events from authenticated;
grant all on public.llm_usage_events to service_role;

-- table mcp_api_tokens
grant select, insert, update, delete on public.mcp_api_tokens to anon;
revoke truncate, references, trigger on public.mcp_api_tokens from anon;
grant select, insert, update, delete on public.mcp_api_tokens to authenticated;
revoke truncate, references, trigger on public.mcp_api_tokens from authenticated;
grant all on public.mcp_api_tokens to service_role;

-- table menerio_integration
revoke select, insert, update, delete, truncate, references, trigger on public.menerio_integration from anon;
grant delete on public.menerio_integration to authenticated;
revoke select, insert, update, truncate, references, trigger on public.menerio_integration from authenticated;
grant all on public.menerio_integration to service_role;
grant select (auto_sync), insert (auto_sync), update (auto_sync) on public.menerio_integration to authenticated;
grant select (created_at) on public.menerio_integration to authenticated;
grant select (id) on public.menerio_integration to authenticated;
grant select (is_active), insert (is_active), update (is_active) on public.menerio_integration to authenticated;
grant select (last_sync_at), update (last_sync_at) on public.menerio_integration to authenticated;
grant insert (menerio_api_key), update (menerio_api_key) on public.menerio_integration to authenticated;
grant select (menerio_base_url), insert (menerio_base_url), update (menerio_base_url) on public.menerio_integration to authenticated;
grant select (menerio_display_name), insert (menerio_display_name), update (menerio_display_name) on public.menerio_integration to authenticated;
grant select (sync_artifact_types), insert (sync_artifact_types), update (sync_artifact_types) on public.menerio_integration to authenticated;
grant select (updated_at) on public.menerio_integration to authenticated;
grant select (user_id), insert (user_id) on public.menerio_integration to authenticated;

-- table menerio_sync_queue
grant select, insert, update, delete on public.menerio_sync_queue to anon;
revoke truncate, references, trigger on public.menerio_sync_queue from anon;
grant select, insert, update, delete on public.menerio_sync_queue to authenticated;
revoke truncate, references, trigger on public.menerio_sync_queue from authenticated;
grant all on public.menerio_sync_queue to service_role;

-- table moderation_events
grant select, insert, update, delete on public.moderation_events to anon;
revoke truncate, references, trigger on public.moderation_events from anon;
grant select, insert, update, delete on public.moderation_events to authenticated;
revoke truncate, references, trigger on public.moderation_events from authenticated;
grant all on public.moderation_events to service_role;

-- table moderation_review_queue
grant select, insert, update, delete on public.moderation_review_queue to anon;
revoke truncate, references, trigger on public.moderation_review_queue from anon;
grant select, insert, update, delete on public.moderation_review_queue to authenticated;
revoke truncate, references, trigger on public.moderation_review_queue from authenticated;
grant all on public.moderation_review_queue to service_role;

-- table moderation_stopwords
grant select, insert, update, delete on public.moderation_stopwords to anon;
revoke truncate, references, trigger on public.moderation_stopwords from anon;
grant select, insert, update, delete on public.moderation_stopwords to authenticated;
revoke truncate, references, trigger on public.moderation_stopwords from authenticated;
grant all on public.moderation_stopwords to service_role;

-- table profiles
grant insert, update, delete on public.profiles to anon;
revoke select, truncate, references, trigger on public.profiles from anon;
grant insert, update, delete on public.profiles to authenticated;
revoke select, truncate, references, trigger on public.profiles from authenticated;
grant all on public.profiles to service_role;
grant select (avatar_url) on public.profiles to authenticated;
grant select (bio) on public.profiles to authenticated;
grant select (created_at) on public.profiles to authenticated;
grant select (display_name) on public.profiles to authenticated;
grant select (github) on public.profiles to authenticated;
grant select (id) on public.profiles to authenticated;
grant select (twitter) on public.profiles to authenticated;
grant select (updated_at) on public.profiles to authenticated;
grant select (website) on public.profiles to authenticated;
grant select (avatar_url) on public.profiles to anon;
grant select (bio) on public.profiles to anon;
grant select (display_name) on public.profiles to anon;
grant select (github) on public.profiles to anon;
grant select (id) on public.profiles to anon;
grant select (twitter) on public.profiles to anon;
grant select (website) on public.profiles to anon;

-- table prompt_coach_messages
grant select, insert, update, delete on public.prompt_coach_messages to anon;
revoke truncate, references, trigger on public.prompt_coach_messages from anon;
grant select, insert, update, delete on public.prompt_coach_messages to authenticated;
revoke truncate, references, trigger on public.prompt_coach_messages from authenticated;
grant all on public.prompt_coach_messages to service_role;

-- sequence prompt_coach_messages_id_seq
grant all on sequence public.prompt_coach_messages_id_seq to anon;
grant all on sequence public.prompt_coach_messages_id_seq to authenticated;
grant all on sequence public.prompt_coach_messages_id_seq to service_role;

-- table prompt_copy_events
revoke select, insert, update, delete, truncate, references, trigger on public.prompt_copy_events from anon;
revoke select, insert, update, delete, truncate, references, trigger on public.prompt_copy_events from authenticated;
grant all on public.prompt_copy_events to service_role;

-- table prompt_copy_salts
revoke select, insert, update, delete, truncate, references, trigger on public.prompt_copy_salts from anon;
revoke select, insert, update, delete, truncate, references, trigger on public.prompt_copy_salts from authenticated;
grant all on public.prompt_copy_salts to service_role;

-- table prompt_kit_coach_messages
grant select, insert, update, delete on public.prompt_kit_coach_messages to anon;
revoke truncate, references, trigger on public.prompt_kit_coach_messages from anon;
grant select, insert, update, delete on public.prompt_kit_coach_messages to authenticated;
revoke truncate, references, trigger on public.prompt_kit_coach_messages from authenticated;
grant all on public.prompt_kit_coach_messages to service_role;

-- sequence prompt_kit_coach_messages_id_seq
grant all on sequence public.prompt_kit_coach_messages_id_seq to anon;
grant all on sequence public.prompt_kit_coach_messages_id_seq to authenticated;
grant all on sequence public.prompt_kit_coach_messages_id_seq to service_role;

-- table prompt_kit_pins
grant select, insert, update, delete on public.prompt_kit_pins to anon;
revoke truncate, references, trigger on public.prompt_kit_pins from anon;
grant select, insert, update, delete on public.prompt_kit_pins to authenticated;
revoke truncate, references, trigger on public.prompt_kit_pins from authenticated;
grant all on public.prompt_kit_pins to service_role;

-- table prompt_kit_reviews
grant select, insert, update, delete on public.prompt_kit_reviews to anon;
revoke truncate, references, trigger on public.prompt_kit_reviews from anon;
grant select, insert, update, delete on public.prompt_kit_reviews to authenticated;
revoke truncate, references, trigger on public.prompt_kit_reviews from authenticated;
grant all on public.prompt_kit_reviews to service_role;

-- table prompt_kit_slug_redirects
grant select, insert, update, delete on public.prompt_kit_slug_redirects to anon;
revoke truncate, references, trigger on public.prompt_kit_slug_redirects from anon;
grant select, insert, update, delete on public.prompt_kit_slug_redirects to authenticated;
revoke truncate, references, trigger on public.prompt_kit_slug_redirects from authenticated;
grant all on public.prompt_kit_slug_redirects to service_role;

-- table prompt_kit_versions
grant select, insert, update, delete on public.prompt_kit_versions to anon;
revoke truncate, references, trigger on public.prompt_kit_versions from anon;
grant select, insert, update, delete on public.prompt_kit_versions to authenticated;
revoke truncate, references, trigger on public.prompt_kit_versions from authenticated;
grant all on public.prompt_kit_versions to service_role;

-- table prompt_kits
grant select, insert, update, delete on public.prompt_kits to anon;
revoke truncate, references, trigger on public.prompt_kits from anon;
grant select, insert, update, delete on public.prompt_kits to authenticated;
revoke truncate, references, trigger on public.prompt_kits from authenticated;
grant all on public.prompt_kits to service_role;

-- table prompt_pins
grant select, insert, update, delete on public.prompt_pins to anon;
revoke truncate, references, trigger on public.prompt_pins from anon;
grant select, insert, update, delete on public.prompt_pins to authenticated;
revoke truncate, references, trigger on public.prompt_pins from authenticated;
grant all on public.prompt_pins to service_role;

-- table prompt_reviews
grant select, insert, update, delete on public.prompt_reviews to anon;
revoke truncate, references, trigger on public.prompt_reviews from anon;
grant select, insert, update, delete on public.prompt_reviews to authenticated;
revoke truncate, references, trigger on public.prompt_reviews from authenticated;
grant all on public.prompt_reviews to service_role;

-- table prompt_slug_redirects
grant select, insert, update, delete on public.prompt_slug_redirects to anon;
revoke truncate, references, trigger on public.prompt_slug_redirects from anon;
grant select, insert, update, delete on public.prompt_slug_redirects to authenticated;
revoke truncate, references, trigger on public.prompt_slug_redirects from authenticated;
grant all on public.prompt_slug_redirects to service_role;

-- table prompt_versions
grant select, insert, update, delete on public.prompt_versions to anon;
revoke truncate, references, trigger on public.prompt_versions from anon;
grant select, insert, update, delete on public.prompt_versions to authenticated;
revoke truncate, references, trigger on public.prompt_versions from authenticated;
grant all on public.prompt_versions to service_role;

-- table prompts
grant select, insert, update, delete on public.prompts to anon;
revoke truncate, references, trigger on public.prompts from anon;
grant select, insert, update, delete on public.prompts to authenticated;
revoke truncate, references, trigger on public.prompts from authenticated;
grant all on public.prompts to service_role;

-- table security_suite_lock
revoke select, insert, update, delete, truncate, references, trigger on public.security_suite_lock from anon;
revoke select, insert, update, delete, truncate, references, trigger on public.security_suite_lock from authenticated;
grant all on public.security_suite_lock to service_role;

-- table skill_reviews
grant select, insert, update, delete on public.skill_reviews to anon;
revoke truncate, references, trigger on public.skill_reviews from anon;
grant select, insert, update, delete on public.skill_reviews to authenticated;
revoke truncate, references, trigger on public.skill_reviews from authenticated;
grant all on public.skill_reviews to service_role;

-- table skill_versions
grant select, insert, update, delete on public.skill_versions to anon;
revoke truncate, references, trigger on public.skill_versions from anon;
grant select, insert, update, delete on public.skill_versions to authenticated;
revoke truncate, references, trigger on public.skill_versions from authenticated;
grant all on public.skill_versions to service_role;

-- table skills
grant select, insert, update, delete on public.skills to anon;
revoke truncate, references, trigger on public.skills from anon;
grant select, insert, update, delete on public.skills to authenticated;
revoke truncate, references, trigger on public.skills from authenticated;
grant all on public.skills to service_role;

-- table suggestions
grant select, insert, update, delete on public.suggestions to anon;
revoke truncate, references, trigger on public.suggestions from anon;
grant select, insert, update, delete on public.suggestions to authenticated;
revoke truncate, references, trigger on public.suggestions from authenticated;
grant all on public.suggestions to service_role;

-- table team_invites
grant select, insert, update, delete on public.team_invites to anon;
revoke truncate, references, trigger on public.team_invites from anon;
grant select, insert, update, delete on public.team_invites to authenticated;
revoke truncate, references, trigger on public.team_invites from authenticated;
grant all on public.team_invites to service_role;

-- table team_members
grant select, insert, update, delete on public.team_members to anon;
revoke truncate, references, trigger on public.team_members from anon;
grant select, insert, update, delete on public.team_members to authenticated;
revoke truncate, references, trigger on public.team_members from authenticated;
grant all on public.team_members to service_role;

-- table teams
grant select, insert, update, delete on public.teams to anon;
revoke truncate, references, trigger on public.teams from anon;
grant select, insert, update, delete on public.teams to authenticated;
revoke truncate, references, trigger on public.teams from authenticated;
grant all on public.teams to service_role;

-- table user_credentials
grant insert, update, delete on public.user_credentials to anon;
revoke select, truncate, references, trigger on public.user_credentials from anon;
grant insert, update, delete on public.user_credentials to authenticated;
revoke select, truncate, references, trigger on public.user_credentials from authenticated;
grant all on public.user_credentials to service_role;
grant select (created_at) on public.user_credentials to authenticated;
grant select (credential_type) on public.user_credentials to authenticated;
grant select (id) on public.user_credentials to authenticated;
grant select (team_id) on public.user_credentials to authenticated;
grant select (updated_at) on public.user_credentials to authenticated;
grant select (user_id) on public.user_credentials to authenticated;

-- table user_roles
grant select, insert, update, delete on public.user_roles to anon;
revoke truncate, references, trigger on public.user_roles from anon;
grant select, insert, update, delete on public.user_roles to authenticated;
revoke truncate, references, trigger on public.user_roles from authenticated;
grant all on public.user_roles to service_role;

-- table user_saved_prompts
grant select, insert, update, delete on public.user_saved_prompts to anon;
revoke truncate, references, trigger on public.user_saved_prompts from anon;
grant select, insert, update, delete on public.user_saved_prompts to authenticated;
revoke truncate, references, trigger on public.user_saved_prompts from authenticated;
grant all on public.user_saved_prompts to service_role;

-- table user_suspensions
grant select, insert, update, delete on public.user_suspensions to anon;
revoke truncate, references, trigger on public.user_suspensions from anon;
grant select, insert, update, delete on public.user_suspensions to authenticated;
revoke truncate, references, trigger on public.user_suspensions from authenticated;
grant all on public.user_suspensions to service_role;

-- view v_ai_allowance_current
grant select, insert, update, delete on public.v_ai_allowance_current to anon;
revoke truncate, references, trigger on public.v_ai_allowance_current from anon;
grant select, insert, update, delete on public.v_ai_allowance_current to authenticated;
revoke truncate, references, trigger on public.v_ai_allowance_current from authenticated;
grant all on public.v_ai_allowance_current to service_role;

-- table workflow_reviews
grant select, insert, update, delete on public.workflow_reviews to anon;
revoke truncate, references, trigger on public.workflow_reviews from anon;
grant select, insert, update, delete on public.workflow_reviews to authenticated;
revoke truncate, references, trigger on public.workflow_reviews from authenticated;
grant all on public.workflow_reviews to service_role;

-- table workflow_versions
grant select, insert, update, delete on public.workflow_versions to anon;
revoke truncate, references, trigger on public.workflow_versions from anon;
grant select, insert, update, delete on public.workflow_versions to authenticated;
revoke truncate, references, trigger on public.workflow_versions from authenticated;
grant all on public.workflow_versions to service_role;

-- table workflows
grant select, insert, update, delete on public.workflows to anon;
revoke truncate, references, trigger on public.workflows from anon;
grant select, insert, update, delete on public.workflows to authenticated;
revoke truncate, references, trigger on public.workflows from authenticated;
grant all on public.workflows to service_role;
-- MAINTAIN exists from Postgres 17 on (the live project runs 17.6).
do $grants$
begin
  if current_setting('server_version_num')::int >= 170000 then
    execute 'revoke maintain on public.activity_events from anon';
    execute 'revoke maintain on public.activity_events from authenticated';
    execute 'revoke maintain on public.admin_allowance_adjustments from anon';
    execute 'revoke maintain on public.admin_allowance_adjustments from authenticated';
    execute 'revoke maintain on public.ai_allowance_periods from anon';
    execute 'revoke maintain on public.ai_allowance_periods from authenticated';
    execute 'revoke maintain on public.ai_credit_settings from anon';
    execute 'revoke maintain on public.ai_credit_settings from authenticated';
    execute 'revoke maintain on public.ai_insights from anon';
    execute 'revoke maintain on public.ai_insights from authenticated';
    execute 'revoke maintain on public.blog_categories from anon';
    execute 'revoke maintain on public.blog_categories from authenticated';
    execute 'revoke maintain on public.blog_media from anon';
    execute 'revoke maintain on public.blog_media from authenticated';
    execute 'revoke maintain on public.blog_post_categories from anon';
    execute 'revoke maintain on public.blog_post_categories from authenticated';
    execute 'revoke maintain on public.blog_post_revisions from anon';
    execute 'revoke maintain on public.blog_post_revisions from authenticated';
    execute 'revoke maintain on public.blog_post_tags from anon';
    execute 'revoke maintain on public.blog_post_tags from authenticated';
    execute 'revoke maintain on public.blog_posts from anon';
    execute 'revoke maintain on public.blog_posts from authenticated';
    execute 'revoke maintain on public.blog_tags from anon';
    execute 'revoke maintain on public.blog_tags from authenticated';
    execute 'revoke maintain on public.collection_items from anon';
    execute 'revoke maintain on public.collection_items from authenticated';
    execute 'revoke maintain on public.collections from anon';
    execute 'revoke maintain on public.collections from authenticated';
    execute 'revoke maintain on public.comments from anon';
    execute 'revoke maintain on public.comments from authenticated';
    execute 'revoke maintain on public.github_sync_queue from anon';
    execute 'revoke maintain on public.github_sync_queue from authenticated';
    execute 'revoke maintain on public.github_sync_state from anon';
    execute 'revoke maintain on public.github_sync_state from authenticated';
    execute 'revoke maintain on public.llm_call_configs from anon';
    execute 'revoke maintain on public.llm_call_configs from authenticated';
    execute 'revoke maintain on public.llm_model_alerts from anon';
    execute 'revoke maintain on public.llm_model_alerts from authenticated';
    execute 'revoke maintain on public.llm_models from anon';
    execute 'revoke maintain on public.llm_models from authenticated';
    execute 'revoke maintain on public.llm_usage_events from anon';
    execute 'revoke maintain on public.llm_usage_events from authenticated';
    execute 'revoke maintain on public.mcp_api_tokens from anon';
    execute 'revoke maintain on public.mcp_api_tokens from authenticated';
    execute 'revoke maintain on public.menerio_integration from anon';
    execute 'revoke maintain on public.menerio_integration from authenticated';
    execute 'revoke maintain on public.menerio_sync_queue from anon';
    execute 'revoke maintain on public.menerio_sync_queue from authenticated';
    execute 'revoke maintain on public.moderation_events from anon';
    execute 'revoke maintain on public.moderation_events from authenticated';
    execute 'revoke maintain on public.moderation_review_queue from anon';
    execute 'revoke maintain on public.moderation_review_queue from authenticated';
    execute 'revoke maintain on public.moderation_stopwords from anon';
    execute 'revoke maintain on public.moderation_stopwords from authenticated';
    execute 'revoke maintain on public.profiles from anon';
    execute 'revoke maintain on public.profiles from authenticated';
    execute 'revoke maintain on public.prompt_coach_messages from anon';
    execute 'revoke maintain on public.prompt_coach_messages from authenticated';
    execute 'revoke maintain on public.prompt_copy_events from anon';
    execute 'revoke maintain on public.prompt_copy_events from authenticated';
    execute 'revoke maintain on public.prompt_copy_salts from anon';
    execute 'revoke maintain on public.prompt_copy_salts from authenticated';
    execute 'revoke maintain on public.prompt_kit_coach_messages from anon';
    execute 'revoke maintain on public.prompt_kit_coach_messages from authenticated';
    execute 'revoke maintain on public.prompt_kit_pins from anon';
    execute 'revoke maintain on public.prompt_kit_pins from authenticated';
    execute 'revoke maintain on public.prompt_kit_reviews from anon';
    execute 'revoke maintain on public.prompt_kit_reviews from authenticated';
    execute 'revoke maintain on public.prompt_kit_slug_redirects from anon';
    execute 'revoke maintain on public.prompt_kit_slug_redirects from authenticated';
    execute 'revoke maintain on public.prompt_kit_versions from anon';
    execute 'revoke maintain on public.prompt_kit_versions from authenticated';
    execute 'revoke maintain on public.prompt_kits from anon';
    execute 'revoke maintain on public.prompt_kits from authenticated';
    execute 'revoke maintain on public.prompt_pins from anon';
    execute 'revoke maintain on public.prompt_pins from authenticated';
    execute 'revoke maintain on public.prompt_reviews from anon';
    execute 'revoke maintain on public.prompt_reviews from authenticated';
    execute 'revoke maintain on public.prompt_slug_redirects from anon';
    execute 'revoke maintain on public.prompt_slug_redirects from authenticated';
    execute 'revoke maintain on public.prompt_versions from anon';
    execute 'revoke maintain on public.prompt_versions from authenticated';
    execute 'revoke maintain on public.prompts from anon';
    execute 'revoke maintain on public.prompts from authenticated';
    execute 'revoke maintain on public.security_suite_lock from anon';
    execute 'revoke maintain on public.security_suite_lock from authenticated';
    execute 'revoke maintain on public.skill_reviews from anon';
    execute 'revoke maintain on public.skill_reviews from authenticated';
    execute 'revoke maintain on public.skill_versions from anon';
    execute 'revoke maintain on public.skill_versions from authenticated';
    execute 'revoke maintain on public.skills from anon';
    execute 'revoke maintain on public.skills from authenticated';
    execute 'revoke maintain on public.suggestions from anon';
    execute 'revoke maintain on public.suggestions from authenticated';
    execute 'revoke maintain on public.team_invites from anon';
    execute 'revoke maintain on public.team_invites from authenticated';
    execute 'revoke maintain on public.team_members from anon';
    execute 'revoke maintain on public.team_members from authenticated';
    execute 'revoke maintain on public.teams from anon';
    execute 'revoke maintain on public.teams from authenticated';
    execute 'revoke maintain on public.user_credentials from anon';
    execute 'revoke maintain on public.user_credentials from authenticated';
    execute 'revoke maintain on public.user_roles from anon';
    execute 'revoke maintain on public.user_roles from authenticated';
    execute 'revoke maintain on public.user_saved_prompts from anon';
    execute 'revoke maintain on public.user_saved_prompts from authenticated';
    execute 'revoke maintain on public.user_suspensions from anon';
    execute 'revoke maintain on public.user_suspensions from authenticated';
    execute 'revoke maintain on public.v_ai_allowance_current from anon';
    execute 'revoke maintain on public.v_ai_allowance_current from authenticated';
    execute 'revoke maintain on public.workflow_reviews from anon';
    execute 'revoke maintain on public.workflow_reviews from authenticated';
    execute 'revoke maintain on public.workflow_versions from anon';
    execute 'revoke maintain on public.workflow_versions from authenticated';
    execute 'revoke maintain on public.workflows from anon';
    execute 'revoke maintain on public.workflows from authenticated';
  end if;
end
$grants$;
