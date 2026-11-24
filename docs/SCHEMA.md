# Database Schema

This document describes the main database tables in Querino, and the rules
the database itself enforces on them. Production is the truth: when this page
and `supabase/migrations/` disagree with the live catalogue, the catalogue
wins. Last checked against production on 2026-09-30.

## Core Tables

### `profiles`

User profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (references auth.users) |
| display_name | text | User's display name |
| avatar_url | text | Profile picture URL |
| bio | text | User biography |
| website | text | Personal website |
| twitter | text | Twitter/X handle |
| github | text | GitHub username |
| role | text | Legacy (user, admin); grants nothing, `user_roles` decides |
| plan_type | text | Legacy (free, premium, team); `user_roles` decides |
| plan_source | text | Legacy (internal, stripe, gifted, test) |
| github_sync_enabled | boolean | GitHub sync enabled |
| github_repo | text | GitHub repository (owner/repo) |
| github_branch | text | Git branch for sync |
| github_folder | text | Target folder in repo |

---

### `prompts`

AI prompts created by users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Prompt title |
| description | text | Brief description |
| content | text | Full prompt text |
| category | text | Category (Writing, Coding, etc.) |
| tags | text[] | Array of tags |
| author_id | uuid | Owner (references profiles) |
| team_id | uuid | Team ownership (optional) |
| is_public | boolean | Public visibility |
| published_at | timestamptz | When it first became public (set by the database, see "Rules the database enforces") |
| slug | text | URL-friendly slug |
| rating_avg | numeric | Average rating |
| rating_count | integer | Number of ratings |
| copies_count | integer | Times cloned |
| embedding | vector(1536) | Semantic search embedding |
| embedding_attempts, embedding_error, embedding_failed_at | | Embedding job bookkeeping |
| embedding_claimed_at | timestamptz | The embedding job's lease on the row |
| menerio_synced, menerio_note_id, menerio_synced_at | | Menerio sync bookkeeping |
| fts | tsvector | Generated from title, description and content, for search |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last change by a person (see "Rules the database enforces") |

`skills`, `workflows` and `prompt_kits` carry the same bookkeeping columns and
`published_at`.

---

### `skills`

Reusable prompt frameworks and system prompts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Skill title |
| description | text | Brief description |
| content | text | Full skill content |
| category | text | Category |
| tags | text[] | Array of tags |
| author_id | uuid | Owner (references profiles) |
| team_id | uuid | Team ownership (optional) |
| published | boolean | Public visibility |
| published_at | timestamptz | When it first became public (set by the database, see "Rules the database enforces") |
| slug | text | URL-friendly slug |
| rating_avg | numeric | Average rating |
| rating_count | integer | Number of ratings |
| embedding | vector(1536) | Semantic search embedding |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

---

### `claws` (removed)

Dropped by migration `20260430155205` in April 2026. The MCP tools that still
read it were removed on 2026-09-08. Nothing in the product has a claws table.

---

### `workflows`

Documented automation sequences.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Workflow title |
| description | text | Brief description |
| content | text | Markdown content |
| json | jsonb | Structured workflow data |
| category | text | Category |
| tags | text[] | Array of tags |
| author_id | uuid | Owner (references profiles) |
| team_id | uuid | Team ownership (optional) |
| published | boolean | Public visibility |
| published_at | timestamptz | When it first became public (set by the database, see "Rules the database enforces") |
| slug | text | URL-friendly slug |
| rating_avg | numeric | Average rating |
| rating_count | integer | Number of ratings |
| embedding | vector(1536) | Semantic search embedding |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

---

### `collections`

Groups of related artifacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Collection title |
| description | text | Brief description |
| owner_id | uuid | Owner (references profiles) |
| team_id | uuid | Team ownership (optional) |
| is_public | boolean | Public visibility |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

---

### `collection_items`

Items within collections.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| collection_id | uuid | Parent collection |
| item_id | uuid | Referenced item ID |
| item_type | text | Type: prompt, skill, workflow, prompt_kit |
| sort_order | integer | Display order |
| created_at | timestamptz | Added timestamp |

### `creator_links`

At most one link per published item to the creator's own project (#46),
shown under the item in a "From the creator" box and followed through
`/go/<item-id>`. Migration `20261119120000`.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| item_type | text | prompt, skill, workflow, prompt_kit; unique with item_id |
| item_id | uuid | The item |
| url | text | http(s) address, at most 2048 characters |
| label | text | The name shown, at most 40 characters ('' shows the domain) |
| status | text | pending, approved, rejected, unreachable |
| checked_at | timestamptz | When the link check last decided |
| reason | text | Why it is not shown |
| click_count | integer | Clicks through /go |
| created_at, updated_at | timestamptz | Timestamps |

Only `approved` on a public item is ever shown or followed. The author reads,
removes and adds their own row (row-level security through `is_item_owner`),
and may write only `url` and `label` (column grants); changing either sets the
status back to `pending`. anon has no access to the table: it reads a shown
link through `public_creator_link(item_type, item_id)` and follows one through
`follow_creator_link(item_id)`, which counts the click and returns the stored
address. Deleting an item deletes its link (`delete_creator_link` trigger on
the four artifact tables), and so does deleting the account that owns it.
`follow_creator_link` also adds the click to the day's row of
`item_stats_daily`.

### `item_stats_daily`

What an item's author sees on its Stats tab and in the Library (#48): per item
and UTC day, how often it was viewed, copied and sent. Migration
`20261119150000`.

| Column | Type | Description |
|--------|------|-------------|
| item_type | text | prompt, skill, workflow, prompt_kit |
| item_id | uuid | The item |
| day | date | The UTC day; primary key with item_type and item_id |
| views | integer | Page views (`record_item_view`) |
| copies | integer | Visitors who copied it or downloaded it as .md |
| sends_chatgpt, sends_claude, sends_gemini, sends_perplexity | integer | Visitors who sent it to that assistant |
| clicks | integer | Clicks on the creator link through /go |

Nothing about a visitor is stored here, only the item, the day and the
counts. Only the item's author reads its rows (row-level security through
`is_item_owner`); anon and every other person read nothing, and no browser
role writes. Only public items are counted, and never the author's own views,
copies and sends. `record_item_view(item_type, item_id)` refuses a missing
user agent and known bots; it keeps no visitor key, so it cannot count a visitor
once. The cron job `prune-item-stats` drops rows older than 400 days.
Deleting an item deletes its rows (`delete_item_stats` trigger on the four
artifact tables).

### `item_use_events`

One row per visitor, item, channel (copy, chatgpt, claude, gemini,
perplexity) and day, so `record_item_use(item_type, item_id, channel)` counts
a copy, download or send once. `visitor_key` is the same
day-salted HMAC `prompt_copy_events` uses, under the day's key in
`prompt_copy_salts`; never a user id or an address. No browser
role can read it; `prune-item-stats` drops it after two days, the day its key
goes. `record_prompt_copy(prompt_id)` goes through `record_item_use`, and
`prompts.copies_count` still counts a copy or a send once per visitor, prompt
and day, never a download.

---

## Team Tables

### `teams`

Team/organization workspaces.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Team name |
| owner_id | uuid | Team owner (references profiles) |
| github_repo | text | Team GitHub repository |
| github_branch | text | Git branch for sync |
| github_folder | text | Target folder in repo |
| created_at | timestamptz | Creation timestamp |

---

### `team_members`

Team membership.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| team_id | uuid | Team (references teams) |
| user_id | uuid | Member (references profiles) |
| role | text | Role: owner, admin, member |
| created_at | timestamptz | Join timestamp |

---

### `team_invites`

Invite links. Readable only by the team's owner and admins; a person holding
a token uses `get_team_invite_preview` to see the team and
`redeem_team_invite` to join.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| team_id | uuid | Team (references teams) |
| token | text | 24 random bytes, base64 |
| role | text | Role the invite grants: member, admin |
| created_by | uuid | Owner or admin who made it |
| expires_at | timestamptz | Default 14 days after creation |
| used_count | integer | Times redeemed |

---

## Review & Interaction Tables

### `prompt_reviews`, `skill_reviews`, `workflow_reviews`

User ratings and reviews.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| [item]_id | uuid | Reviewed item |
| user_id | uuid | Reviewer |
| rating | integer | 1-5 star rating |
| comment | text | Optional review text |
| created_at | timestamptz | Review timestamp |
| updated_at | timestamptz | Last update |

---

### `comments`

Discussion comments on artifacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| item_id | uuid | Commented item |
| item_type | text | Type: prompt, skill, workflow, prompt_kit, collection |
| user_id | uuid | Commenter |
| content | text | Comment text |
| parent_id | uuid | Parent comment (for replies) |
| edited | boolean | Has been edited |
| created_at | timestamptz | Comment timestamp |
| updated_at | timestamptz | Last update |

---

### `suggestions`

Edit suggestions for artifacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| item_id | uuid | Target item |
| item_type | text | Type: prompt, skill, workflow, prompt_kit |
| author_id | uuid | Suggester |
| title | text | Suggestion title |
| description | text | Change description |
| content | text | Suggested new content |
| status | text | open, changes_requested, accepted, rejected |
| reviewer_id | uuid | Reviewer |
| review_comment | text | Review feedback |
| requested_changes | jsonb | What the reviewer asked for |
| created_at | timestamptz | Submission timestamp |
| updated_at | timestamptz | Last update |

---

## User Data Tables

### `user_saved_prompts`

Bookmarked/favorited prompts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User |
| prompt_id | uuid | Saved prompt |
| created_at | timestamptz | Save timestamp |

---

### `prompt_pins`

Pinned prompts for quick access.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User |
| prompt_id | uuid | Pinned prompt |
| created_at | timestamptz | Pin timestamp |

---

### `user_credentials`

Stored credentials (GitHub tokens, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Credential owner |
| team_id | uuid | Team (for shared credentials) |
| credential_type | text | Type: github_token |
| credential_value | text | Always NULL at rest: the trigger moves it into Vault |
| credential_secret_id | uuid | The Vault secret; read only through `read_user_credential` (service role) |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

---

## AI & Analytics Tables

### Architecture: Tokens as Source of Truth

The AI credit system uses **tokens as the single source of truth**. Display credits are calculated dynamically using the current `tokens_per_credit` setting. This allows admins to adjust the conversion rate without requiring database migrations.

**Credit Calculation**: `credits = tokens / tokens_per_credit`

### `ai_credit_settings`

Admin-configurable global settings.

| Key | Default | Description |
|-----|---------|-------------|
| `tokens_per_credit` | 2000 | LLM tokens per display credit |
| `credits_free_per_month` | 500 | Monthly credits for free users |
| `credits_premium_per_month` | 1500 | Monthly credits for premium users |
| `max_free_accounts` | 100 | Signup cap checked by `check_signup_allowed` |

Values as set in production on 2026-09-30.

---

### `ai_allowance_periods`

Monthly token allowances per user. Credits are NOT stored—calculated at display time.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User |
| tokens_granted | bigint | Total tokens allocated (base + rollover) |
| tokens_used | bigint | Tokens consumed by LLM calls |
| period_start | timestamptz | Period start |
| period_end | timestamptz | Period end |
| source | text | Origin: subscription, free_tier, admin_grant |
| metadata | jsonb | Contains rollover_tokens, base_tokens |

---

### `llm_usage_events`

Append-only ledger of LLM API calls.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User |
| idempotency_key | text | Prevents duplicate charges |
| feature | text | Feature used |
| model | text | LLM model |
| prompt_tokens | bigint | Input tokens |
| completion_tokens | bigint | Output tokens |
| total_tokens | bigint | Total tokens |
| credits_charged | numeric | Credits charged (historical) |
| created_at | timestamptz | Usage timestamp |

---

### `activity_events`

User activity log.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| actor_id | uuid | User who performed action |
| team_id | uuid | Team context (optional) |
| action | text | Action type |
| item_type | text | Affected item type |
| item_id | uuid | Affected item ID |
| metadata | jsonb | Additional data |
| created_at | timestamptz | Event timestamp |

---

## Views

### `v_ai_allowance_current`

Current AI allowance with dynamically calculated credits.

| Column | Description |
|--------|-------------|
| tokens_granted | Source of truth: granted tokens |
| tokens_used | Source of truth: used tokens |
| remaining_tokens | Calculated: granted - used |
| tokens_per_credit | Current conversion factor from settings |
| credits_granted | Calculated: tokens_granted / tokens_per_credit |
| credits_used | Calculated: tokens_used / tokens_per_credit |
| remaining_credits | Calculated: remaining_tokens / tokens_per_credit |

---

## Key Functions

| Function | Description |
|----------|-------------|
| `is_admin(user_id)` | Check if user is admin |
| `is_premium_user(user_id)` | Check if user has premium plan |
| `is_team_member(team_id, user_id)` | Check team membership |
| `is_team_admin_or_owner(team_id, user_id)` | Check team admin status |
| `get_team_invite_preview(token)` | Team name, role, inviter and "already a member" for a valid, unexpired invite; signed-in callers only, joins nobody |
| `redeem_team_invite(token)` | Join a team with an invite (Premium); signed-in callers only |
| `leave_team(team_id)` | Leave a team as a non-owner, with or without Premium |
| `read_user_credential(type, user_id, team_id)` | Decrypt a stored token; service role only |
| `get_similar_prompts(target_id)` | Find semantically similar prompts |
| `get_similar_skills(target_id)` | Find semantically similar skills |
| `get_similar_workflows(target_id)` | Find semantically similar workflows |
| `search_prompts_semantic(embedding)` | Semantic search for prompts |
| `generate_unique_slug(title, table)` | Generate URL-friendly slug |

---

## Rules the database enforces

Written down because each of them was once missing, and a policy that looks
right on its own is OR-ed with every other permissive policy on its table.

**Who may write which columns.**

- An artifact's owner (`author_id`, or `owner_id` on collections) cannot be
  changed from the browser (`refuse_artifact_owner_change`).
- `rating_avg`, `rating_count`, `copies_count` and `embedding` are computed.
  A write from the browser roles is silently ignored: a new row starts at zero
  and without an embedding, an update keeps the stored values
  (`keep_computed_columns_computed`, 2026-09-30). The review triggers, the
  embedding job and the service role are not affected.
- `profiles.role`, `plan_type` and `plan_source` change only by an admin
  (`guard_privileged_profile_columns`).
- A comment keeps its author, artifact and parent; a suggestion keeps its
  author and artifact, and `reviewer_id` can only be set to the caller or
  cleared (`refuse_discussion_move`, 2026-09-30). Reviews keep their author and
  artifact (`refuse_review_retarget`).
- A suggestion's author may edit it while it is `open` or `changes_requested`
  and may only leave it `open` with no reviewer; accepting and rejecting belong
  to the artifact's owner.
- A team credential (`user_credentials.team_id`) can only be written by
  someone with a seat on that team, the team's GitHub sync only ever uses the
  token of a current seat holder (owner first, then the newest), and losing a
  seat deletes that person's tokens for the team (2026-09-30).

**What `updated_at` means on prompts, skills, workflows and prompt kits.** It
is the time a person last changed the artifact. Writes that touch only the
bookkeeping columns (embedding, Menerio sync, ratings, copies, `fts`) keep it
as it was (`touch_artifact_updated_at`, 2026-09-30). A machine (service role,
cron) that sets `updated_at` itself is obeyed; the browser is not.

**What `published_at` means on prompts, skills, workflows and prompt kits.**
It is the moment the artifact first became public, however it became public
(publish dialog, edit form, MCP server, a direct write). The database stamps it
for every role, the service role and cron included (`stamp_published_at`,
2026-11-19); a value a client sends is ignored. Unpublishing keeps it, and
republishing keeps the first date. It is bookkeeping for `updated_at`: it only
changes together with the visibility flag, which is what moves `updated_at`.
The RSS feed dates and orders every artifact by it.

**Deleting.**

- An account: what it made or owns goes with it, what records money
  (`llm_usage_events`) stays without the person. See CLAUDE.md.
- An artifact: its AI insights, comments, suggestions and the entries pointing
  at it in anybody's collections go with it; a collection takes the comments
  written on it (`delete_artifact_attachments`, 2026-09-30). Activity events and
  the sync queues stay, because they are history and the way the deletion
  reaches GitHub and Menerio.

**What the browser roles hold.** `anon` and `authenticated` hold SELECT,
INSERT, UPDATE and DELETE on public tables (row-level security decides the
rows), and no TRUNCATE, REFERENCES, TRIGGER or MAINTAIN, including on tables
created later by `postgres` (2026-09-30). Every SECURITY DEFINER function
created from 2026-09-30 on revokes EXECUTE from PUBLIC in its own migration or
grants it on purpose (`scripts/check-migrations.mjs`, rule 4), and
`tests/security/28` lists the ones the anon key may call.
