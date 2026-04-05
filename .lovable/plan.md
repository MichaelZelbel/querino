

# Async AI Content Moderation (Tier 2)

## Concept

Instead of blocking the user's save/publish action with a slow LLM call, content is published immediately (after passing the fast Tier 1 stopword check). A background review queue picks up every newly published or updated public artifact and runs it through an AI classifier. If the AI flags a violation with high confidence, the system automatically unpublishes the content and emails the user.

```text
User publishes artifact
        │
        ▼
┌──────────────────────┐
│  Tier 1: Stopwords   │  Synchronous, fast (~50ms)
│  (existing system)   │  Blocks obvious violations instantly
└────────┬─────────────┘
         │ passes → content goes live
         ▼
┌──────────────────────┐
│  Queue for AI review │  Row inserted into moderation_review_queue
└────────┬─────────────┘
         │ (async, triggered by pg_cron or DB trigger)
         ▼
┌──────────────────────┐
│  ai-moderate-content │  New edge function (~3-5s per item)
│  (Lovable AI Gateway)│  Classifies: sexual, hate, malware, PII, injection
└────────┬─────────────┘
         │
    ┌────┴────┐
    │ SAFE    │ VIOLATION (confidence >= 0.85)
    ▼         ▼
 Mark as     1. Unpublish artifact
 reviewed    2. Log moderation event + increment strike
             3. Send notification email via Resend
```

## Database Changes

### New table: `moderation_review_queue`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| item_type | text | prompt, skill, claw, workflow |
| item_id | uuid | |
| user_id | uuid | Author |
| content_snapshot | text | Content at time of publish (for review) |
| status | text | pending, reviewed, violation, error |
| ai_category | text | Result from AI (null until reviewed) |
| ai_confidence | float | 0.0-1.0 |
| ai_reason | text | AI explanation |
| created_at | timestamptz | |
| reviewed_at | timestamptz | |

RLS: INSERT for authenticated (own user_id), SELECT/UPDATE for admin only.

### Migration: Add `tier` column to `moderation_events`

To distinguish Tier 1 (stopword) blocks from Tier 2 (AI) blocks.

## New Edge Function: `ai-moderate-content`

Called on a schedule (every 2 minutes via pg_cron) or manually by admin. Processes pending items in the queue:

1. Fetch up to 5 pending items from `moderation_review_queue`
2. For each, call Lovable AI Gateway (`google/gemini-3-flash-preview`) with a classification prompt
3. If `safe === false` and `confidence >= 0.85`:
   - Unpublish the artifact (set `is_public = false` / `published = false`)
   - Insert a `moderation_events` row with `tier = 'ai'`
   - Increment strike count on `user_suspensions`
   - Send a notification email to the user via Resend
4. Mark the queue item as `reviewed` or `violation`

Uses `LOVABLE_API_KEY` (already available) for the AI call and `RESEND_API_KEY` (already available) for email.

## Queueing Logic

Modify the existing `moderate-content` edge function: after Tier 1 passes and returns `approved: true`, also insert a row into `moderation_review_queue` with the content snapshot. This ensures every publish/edit-public action is queued for async AI review without adding latency.

## Notification Email

When an artifact is auto-unpublished, the user receives an email:

> **Subject:** Your [prompt/skill] "[Title]" has been unpublished
>
> Our automated review found that your content may violate our Community Guidelines (Category: [e.g., Inappropriate content]).
>
> Your artifact has been set to private. You can still access and edit it in your library.
>
> If you believe this is a mistake, please contact support@querino.ai.

## Admin Panel Updates

Add a new sub-tab "AI Review Queue" in the Moderation panel showing:
- Pending items count
- Recently reviewed items with AI verdict, confidence, and reason
- Manual "Re-review" button to re-queue items
- Existing moderation log shows `tier` badge (Stopword vs AI)

## Files Changed

| File | Change |
|---|---|
| `supabase/migrations/[new].sql` | Create `moderation_review_queue` table + add `tier` column to `moderation_events` |
| `supabase/functions/moderate-content/index.ts` | After Tier 1 pass, insert queue row |
| `supabase/functions/ai-moderate-content/index.ts` | New function: process queue, classify with AI, unpublish + email |
| `src/components/admin/ModerationPanel.tsx` | Add AI Review Queue tab, show tier badges |

## Scheduling

Use pg_cron to call `ai-moderate-content` every 2 minutes, processing up to 5 items per run. This keeps costs predictable and avoids rate limits.

## Cost & Safety

- **Model**: `google/gemini-3-flash-preview` — fast, cheap
- **Confidence threshold**: 0.85 — only auto-unpublish on high confidence to minimize false positives
- **Lower confidence (0.5-0.85)**: Flagged for admin manual review but not auto-unpublished
- **Fail-open**: If AI call fails, item stays published and is retried next cycle (max 3 retries)
- **No user-facing latency**: Publish action is instant (only Tier 1 stopwords block synchronously)

