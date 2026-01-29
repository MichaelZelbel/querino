# Database Schema

This document describes the main database tables in Querino.

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
| role | text | User role (user, admin) |
| plan_type | text | Subscription plan (free, premium) |
| plan_source | text | Plan source (stripe, manual) |
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
| slug | text | URL-friendly slug |
| rating_avg | numeric | Average rating |
| rating_count | integer | Number of ratings |
| copies_count | integer | Times cloned |
| embedding | vector(1536) | Semantic search embedding |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

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
| slug | text | URL-friendly slug |
| rating_avg | numeric | Average rating |
| rating_count | integer | Number of ratings |
| embedding | vector(1536) | Semantic search embedding |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

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
| item_type | text | Type: prompt, skill, workflow |
| sort_order | integer | Display order |
| created_at | timestamptz | Added timestamp |

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
| item_type | text | Type: prompt, skill, workflow |
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
| item_type | text | Type: prompt, skill, workflow |
| author_id | uuid | Suggester |
| title | text | Suggestion title |
| description | text | Change description |
| content | text | Suggested new content |
| status | text | pending, approved, rejected |
| reviewer_id | uuid | Reviewer |
| review_comment | text | Review feedback |
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
| credential_value | text | Encrypted value |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

---

## AI & Analytics Tables

### `ai_allowance_periods`

User AI credit allowances.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User |
| tokens_granted | integer | Total tokens allocated |
| tokens_used | integer | Tokens consumed |
| milli_credits_granted | integer | Credits in 1/1000 units |
| milli_credits_used | integer | Credits consumed |
| period_start | timestamptz | Period start |
| period_end | timestamptz | Period end |
| source | text | free, premium |

---

### `llm_usage_events`

LLM API usage tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User |
| feature | text | Feature used |
| model | text | LLM model |
| prompt_tokens | integer | Input tokens |
| completion_tokens | integer | Output tokens |
| total_tokens | integer | Total tokens |
| credits_charged | integer | Credits deducted |
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

Current AI allowance period for each user with calculated remaining credits.

| Column | Description |
|--------|-------------|
| remaining_tokens | Tokens remaining in current period |
| remaining_credits | Display credits remaining |
| remaining_milli_credits | Milli-credits remaining |
| display_credits | User-facing credit count |

---

## Key Functions

| Function | Description |
|----------|-------------|
| `is_admin(user_id)` | Check if user is admin |
| `is_premium_user(user_id)` | Check if user has premium plan |
| `is_team_member(team_id, user_id)` | Check team membership |
| `is_team_admin_or_owner(team_id, user_id)` | Check team admin status |
| `get_similar_prompts(target_id)` | Find semantically similar prompts |
| `get_similar_skills(target_id)` | Find semantically similar skills |
| `get_similar_workflows(target_id)` | Find semantically similar workflows |
| `search_prompts_semantic(embedding)` | Semantic search for prompts |
| `generate_unique_slug(title, table)` | Generate URL-friendly slug |
