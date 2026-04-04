

# Content Moderation System for Querino

## Problem

Currently, any user can publish artifacts (prompts, skills, workflows, claws) and post comments with zero content checks. This exposes the platform to abuse: pornographic content, malware in skill files, defamation, PII leaks, and spam.

## Architecture Overview

```text
User action (publish / edit public / comment)
        │
        ▼
┌──────────────────────┐
│  Client-side check   │  Quick keyword filter (instant UX feedback)
│  (moderation util)   │
└────────┬─────────────┘
         │ passes
         ▼
┌──────────────────────┐
│  Edge Function       │  Server-side validation (authoritative)
│  "moderate-content"  │  - Stopword list from DB
│  POST /moderate      │  - Pattern matching (leet-speak, unicode tricks)
│                      │  - Category classification
│                      │  - PII detection (emails, phones, SSNs)
└────────┬─────────────┘
         │
    ┌────┴────┐
    │ PASS    │ FAIL
    ▼         ▼
 Proceed   Block + log moderation_events
           + increment user strike count
           + auto-suspend if threshold reached
```

## What Gets Moderated (and When)

| Action | Moderated fields | Timing |
|---|---|---|
| Publish prompt (toggle public / publish modal) | title, description, content, summary, example_output | Before `is_public = true` |
| Edit a public prompt | title, description, content | Before save (if is_public = true) |
| Publish skill/claw/workflow | title, description, content/json | Before `published = true` |
| Edit a public skill/claw/workflow | title, description, content | Before save (if published = true) |
| Post or edit a comment | content | Before insert/update |

Private/draft artifacts are NOT moderated -- only when content goes public.

## Database Changes

### 1. `moderation_stopwords` table
Stores admin-managed stopwords with metadata.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| word | text, unique, not null | The stopword (lowercase) |
| category | text | e.g. "sexual", "hate", "spam", "pii" |
| severity | text | "block" or "warn" |
| created_by | uuid FK auth.users | Admin who added it |
| created_at | timestamptz | |

### 2. `moderation_events` table
Audit log of every moderation action.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK auth.users | Who triggered it |
| action | text | "publish", "edit_public", "comment" |
| item_type | text | "prompt", "skill", "claw", "workflow", "comment" |
| item_id | uuid | |
| flagged_content | text | Snippet that was flagged |
| matched_words | text[] | Which stopwords matched |
| category | text | "sexual", "hate", "pii", etc. |
| result | text | "blocked", "warned", "cleared" |
| created_at | timestamptz | |

### 3. `user_suspensions` table
Tracks suspended users and strike counts.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK auth.users, unique | |
| strike_count | int, default 0 | Incremented per block |
| suspended | boolean, default false | |
| suspended_at | timestamptz | |
| suspended_until | timestamptz, nullable | null = permanent |
| suspension_reason | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4. RLS Policies
- `moderation_stopwords`: SELECT for authenticated (needed for client-side check), INSERT/UPDATE/DELETE for admin only
- `moderation_events`: INSERT for authenticated (own user_id), SELECT for admin only
- `user_suspensions`: SELECT own row for authenticated, full CRUD for admin

## Edge Function: `moderate-content`

**POST** with body:
```json
{
  "content_fields": { "title": "...", "description": "...", "content": "..." },
  "action": "publish" | "edit_public" | "comment",
  "item_type": "prompt" | "skill" | "claw" | "workflow" | "comment",
  "item_id": "uuid"
}
```

**Logic:**
1. Check if user is suspended -> immediate reject
2. Fetch stopwords from `moderation_stopwords`
3. Normalize all text: lowercase, strip leet-speak substitutions (@ -> a, 0 -> o, 1 -> l/i, 3 -> e, $ -> s, etc.), strip unicode confusables, collapse repeated characters
4. Check normalized text against stopwords using substring matching
5. Run PII detection patterns (email regex, phone patterns, SSN patterns)
6. Log result to `moderation_events`
7. If blocked: increment `strike_count` in `user_suspensions`; if strikes >= threshold (default 5), auto-suspend
8. Return `{ approved: true }` or `{ approved: false, reason: "...", category: "..." }`

**Response on block:**
```json
{
  "approved": false,
  "reason": "This content appears to violate our Community Guidelines.",
  "category": "sexual_content",
  "support_hint": "If you believe this is a mistake, please contact support@querino.app"
}
```

## User-Facing Experience

### When publishing and content is blocked
The publish action is intercepted. Instead of the success toast, the user sees an **error dialog**:

> **Content cannot be published**
>
> Your content appears to violate our [Community Guidelines](/community-guidelines). The following issue was detected:
>
> *Category: [e.g. "Inappropriate content"]*
>
> Please review and edit your content. If you believe this is a mistake, contact us at **support@querino.app**.

The artifact remains saved as a private draft -- nothing is lost.

### When editing a public artifact and new content is flagged
The save is blocked with a toast error:

> "Your changes could not be saved because the updated content violates our Community Guidelines. Please review your changes."

The artifact keeps its previous public content. The user can either fix the content or save as private.

### When posting a comment that is flagged
The comment is not posted. A toast error appears:

> "Your comment could not be posted. It appears to violate our Community Guidelines."

### When a suspended user tries to do anything public
All publish/comment actions show:

> "Your account has been suspended due to repeated guideline violations. Contact support@querino.app for assistance."

## Community Guidelines Page

New page at `/community-guidelines` covering:

1. **Respect and Safety** -- No harassment, threats, doxxing, defamation
2. **No Adult/Sexual Content** -- No erotica, pornography, or sexually explicit material
3. **No Malicious Content** -- No malware, viruses, phishing prompts, or social engineering attacks
4. **Privacy** -- No sharing of PII (yours or others')
5. **Intellectual Property** -- No copyrighted material without permission
6. **No Spam** -- No mass publishing of low-quality or duplicate content
7. **Enforcement** -- Violations result in content removal; repeated violations lead to account suspension

Linked from: Terms of Service, Footer, publish dialogs, and moderation error messages.

## Admin Panel Extensions

Add a "Moderation" tab to the existing Admin page with:

1. **Stopword Management** -- Add/edit/delete stopwords with category and severity. Bulk import via textarea (one word per line).
2. **Moderation Log** -- Table of recent moderation events with user, content snippet, matched words, and result. Filterable by category and result.
3. **User Suspensions** -- List of users with strike counts. Ability to manually suspend/unsuspend. Ability to clear strikes (for successful appeals).
4. **Settings** -- Configurable strike threshold for auto-suspension (default: 5).

## Appeal Process (Admin Workflow)

When support receives an appeal:
1. Admin opens Moderation Log, finds the event
2. Reviews the flagged content and matched words
3. If false positive: Admin can clear the strike from User Suspensions, and unsuspend if needed
4. If the stopword itself was too aggressive: Admin can edit or remove it from the stopword list
5. User is notified (via email or in-app) that the decision was reversed

## Client-Side Integration Points

### Utility: `src/lib/moderateContent.ts`
A function that calls the edge function and returns the result. Used by all publish/edit/comment flows.

### Modified flows (6 files):
- `LibraryPromptEdit.tsx` -- wrap `handlePublish` and `handleSave` (when public)
- `PromptNew.tsx` -- wrap submit when `isPublic = true`
- `SkillNew.tsx` / `SkillEdit.tsx` -- wrap submit when `published = true`
- `ClawNew.tsx` / `ClawEdit.tsx` -- wrap submit when `published = true`
- `WorkflowNew.tsx` / `WorkflowEdit.tsx` -- wrap submit when `published = true`
- `CommentsSection.tsx` -- wrap `handleSubmit` and `handleReply`

### Moderation error component: `src/components/moderation/ModerationBlockDialog.tsx`
Reusable dialog shown when content is blocked. Shows the category, links to community guidelines, and provides support contact.

## Implementation Steps

1. Create database migration (3 tables + RLS + trigger for updated_at)
2. Create `moderate-content` edge function
3. Create `src/lib/moderateContent.ts` client utility
4. Create `ModerationBlockDialog.tsx` component
5. Create `/community-guidelines` page and add to router + footer
6. Integrate moderation into all publish/edit/comment flows
7. Add Moderation tab to Admin panel (stopwords CRUD, log viewer, suspension management)
8. Seed initial stopwords (common slurs, explicit terms, spam patterns)

## Suspension Logic

Yes, auto-suspension is a well-established practice (Discord, Reddit, Twitter all do it). The approach:
- Each blocked attempt = 1 strike
- At 5 strikes (configurable): account is auto-suspended
- Suspended users cannot publish, comment, or make content public
- They CAN still access their private library and edit private drafts
- Admins can unsuspend and reset strikes after reviewing appeals

This progressive enforcement prevents persistent abusers from eventually slipping content through while giving legitimate users room for accidental triggers.

