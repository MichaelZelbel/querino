# AI Credits System Implementation Guide

This document provides step-by-step prompts to replicate the complete AI credit/token system in a new Lovable project. Copy each prompt in sequence to build the system incrementally.

---

## Overview

The AI Credits system provides:
- **Token-based tracking** with dynamic credit conversion
- **Monthly allowance periods** with automatic rollover
- **Admin interface** for managing user balances
- **Low credit warnings** and rollover previews
- **Audit logging** for all token changes
- **Cron job** for automatic period resets

---

## Prerequisites

Before starting, ensure your project has:
- Supabase connected (Cloud or external)
- Authentication implemented (users can sign in)
- A `profiles` table with `id`, `plan_type` (free/premium), and `role` (user/admin) columns

---

## Step 1: Database Schema

### Prompt 1.1: Create Core Tables

```
Create an AI credit system with the following database tables:

1. `ai_credit_settings` table:
   - key (text, primary key)
   - value_int (integer, not null)
   - description (text, nullable)
   
   Insert these default rows:
   - tokens_per_credit: 200 (LLM tokens per display credit)
   - credits_free_per_month: 0 (Monthly credits for free users)
   - credits_premium_per_month: 1500 (Monthly credits for premium users)

   RLS: Anyone can SELECT, only admins can UPDATE.

2. `ai_allowance_periods` table:
   - id (uuid, primary key, default gen_random_uuid())
   - user_id (uuid, not null)
   - tokens_granted (bigint, default 0)
   - tokens_used (bigint, default 0)
   - period_start (timestamptz, not null)
   - period_end (timestamptz, not null)
   - source (text, nullable - values like 'subscription', 'free_tier', 'admin_grant')
   - metadata (jsonb, default '{}' - stores rollover_tokens, base_tokens)
   - created_at (timestamptz, default now())
   - updated_at (timestamptz, default now())

   RLS: Users can view their own periods, admins can view/insert/update all.

3. `llm_usage_events` table (append-only ledger):
   - id (uuid, primary key)
   - user_id (uuid, not null)
   - idempotency_key (text, not null, unique)
   - feature (text, nullable - e.g., 'refine_prompt', 'ai_insights', 'admin_balance_adjustment')
   - model (text, nullable)
   - provider (text, nullable)
   - prompt_tokens (bigint, default 0)
   - completion_tokens (bigint, default 0)
   - total_tokens (bigint, default 0)
   - credits_charged (numeric, default 0)
   - metadata (jsonb, default '{}')
   - created_at (timestamptz, default now())

   RLS: Users can only SELECT their own events. No INSERT/UPDATE/DELETE from client.

Add an is_admin(user_id uuid) function that checks if profiles.role = 'admin'.
```

### Prompt 1.2: Create the View

```
Create a database view called `v_ai_allowance_current` that:

1. Selects the CURRENT allowance period for each user (where now() is between period_start and period_end)
2. Joins with ai_credit_settings to get the current tokens_per_credit value
3. Calculates these dynamic fields:
   - remaining_tokens = tokens_granted - tokens_used
   - credits_granted = tokens_granted / tokens_per_credit
   - credits_used = tokens_used / tokens_per_credit
   - remaining_credits = remaining_tokens / tokens_per_credit

The view should expose: id, user_id, tokens_granted, tokens_used, remaining_tokens, tokens_per_credit, credits_granted, credits_used, remaining_credits, period_start, period_end, source, metadata, created_at, updated_at.

This view uses tokens as the source of truth and calculates credits dynamically.
```

---

## Step 2: Edge Function for Token Allowance

### Prompt 2.1: Create ensure-token-allowance Edge Function

```
Create a Supabase Edge Function called `ensure-token-allowance` that:

1. Accepts optional JSON body with:
   - user_id (optional - defaults to authenticated user)
   - batch_init (optional boolean - for cron job to initialize all users)

2. Authorization:
   - If user_id differs from caller, require caller to be admin
   - For batch_init, require admin or service role

3. Logic for single user:
   - Check if user has a current allowance period (now() between period_start and period_end)
   - If yes, return the existing period
   - If no, create a new period:
     a. Calculate period_start (1st of current month) and period_end (1st of next month)
     b. Look up user's plan_type from profiles table
     c. Get credits_free_per_month or credits_premium_per_month from ai_credit_settings
     d. Calculate base_tokens = credits * tokens_per_credit
     e. Check for previous expired period and calculate rollover:
        - rollover_tokens = MIN(previous remaining_tokens, base_tokens)
     f. Insert new period with tokens_granted = base_tokens + rollover_tokens
     g. Store metadata: { base_tokens, rollover_tokens }

4. For batch_init:
   - Query all user_ids from profiles
   - For each user without a current period, create one (same logic as above)
   - Return count of initialized users

5. Return the allowance period data

Use SUPABASE_SERVICE_ROLE_KEY for database operations to bypass RLS.
Set verify_jwt = false in config.toml.
```

---

## Step 3: Frontend Hooks

### Prompt 3.1: Create useAICredits Hook

```
Create a React hook called `useAICredits` in src/hooks/useAICredits.ts that:

1. Fetches the current user's AI credit balance
2. On mount (if user is logged in):
   - Call the ensure-token-allowance edge function to ensure period exists
   - Query v_ai_allowance_current view for user's data
   - Also fetch ai_credit_settings for tokens_per_credit
   - Also fetch user's plan_type from profiles

3. Returns an object with:
   - credits: {
       id, tokensGranted, tokensUsed, remainingTokens,
       creditsGranted, creditsUsed, remainingCredits,
       periodStart, periodEnd, source,
       rolloverTokens, baseTokens (from metadata),
       planBaseCredits (from settings based on plan),
       tokensPerCredit
     }
   - isLoading: boolean
   - error: string | null
   - refetch: function

4. Include a low credit warning effect:
   - Use a ref to track if warning was shown this session
   - If remainingCredits < 15% of total (planBaseCredits + rolloverCredits), show a toast warning
   - Toast message: "Low AI Credits" with "You have X credits remaining. They will reset at the start of your next billing period."
   - Show only once per session
```

### Prompt 3.2: Create useAICreditsGate Hook

```
Create a hook called `useAICreditsGate` in src/hooks/useAICreditsGate.ts that:

1. Uses useAICredits internally
2. Provides a checkCredits() function that:
   - Returns true if user has remaining credits > 0
   - Returns false and shows toast "Please wait until your AI Credits reset." if no credits
   - Returns true while still loading (fail-open, server will catch)

3. Returns: { hasCredits, isLoading, checkCredits, credits, refetchCredits }

Use this hook to gate AI features before making API calls.
```

---

## Step 4: Settings UI Component

### Prompt 4.1: Create CreditsDisplay Component

```
Create a component called `CreditsDisplay` in src/components/settings/CreditsDisplay.tsx that:

1. Uses useAICredits hook to get credit data
2. Shows loading state with spinner while fetching
3. Displays:
   - Header: "AI Credits remaining" with "X of Y" on the right
   - Progress bar showing remaining/total percentage
   - Visual indicator for rollover credits (darker section on progress bar)
   - Rollover preview banner (when within 5 days of period end):
     "X credits will carry over to next period (in N days/tomorrow/today)"
   - Info lines with checkmarks:
     - "Up to X credits rollover"
     - "X credits reset on [date]"

4. Calculate:
   - displayTotal = planBaseCredits + rolloverCredits
   - usagePercentage = (remainingCredits / displayTotal) * 100
   - Show rollover preview only when differenceInDays(periodEnd, now) <= 5

5. Use semantic Tailwind classes (bg-primary, text-muted-foreground, etc.)
6. Use date-fns for date formatting and calculations
7. Use lucide-react icons (Check, Loader2, ArrowRight)
```

---

## Step 5: Admin Interface

### Prompt 5.1: Add AI Credit Settings to Admin

```
Add an "AI Credit Settings" section to the Admin page that:

1. Fetches all rows from ai_credit_settings table
2. Displays each setting with:
   - Setting key as label
   - Current value in an editable input
   - Description as helper text
3. Allows admins to update values inline
4. Shows save button per setting or save all button
5. Updates take effect immediately for all users (since credits are calculated dynamically)
```

### Prompt 5.2: Add User Token Management Modal

```
Create a UserTokenModal component for the Admin user management table that:

1. Opens when admin clicks a coin icon next to a user row
2. Fetches the user's current ai_allowance_periods record via ensure-token-allowance edge function
3. Displays editable fields:
   - Period start/end (read-only display)
   - Tokens granted (editable number input)
   - Tokens used (editable number input)
   - Shows calculated "Remaining" and "Credits equivalent" dynamically

4. On save:
   - Updates ai_allowance_periods with new tokens_granted and tokens_used
   - Logs to llm_usage_events with:
     - feature: "admin_balance_adjustment"
     - metadata containing: admin_id, previous values, new values, deltas, target user info
   - Shows success toast

5. Uses Dialog from shadcn/ui
```

---

## Step 6: Cron Job for Automatic Resets

### Prompt 6.1: Set Up Daily Cron Job

```
Set up a pg_cron job to automatically reset/initialize user token allowances daily:

1. Enable pg_cron and pg_net extensions in Supabase

2. Create a cron job that runs daily at 00:05 UTC:
   - Calls the ensure-token-allowance edge function with { "batch_init": true }
   - Uses the service role key for authentication

3. The cron job ensures:
   - Users who log in on the 1st of the month already have their new period ready
   - Rollover calculations happen automatically
   - No user needs to wait for lazy initialization

SQL for the cron job:
SELECT cron.schedule(
  'daily-token-allowance-reset',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ensure-token-allowance',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"batch_init": true}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Step 7: Integrate with AI Features

### Prompt 7.1: Gate AI Features with Credit Check

```
For each AI feature in the app (e.g., "Refine with AI", "AI Insights", "Prompt Wizard"):

1. Import and use useAICreditsGate hook
2. Before making the AI API call, call checkCredits()
3. If checkCredits() returns false, abort the operation (toast already shown)
4. After successful AI operation, call refetchCredits() to update the display

Example pattern:
const { checkCredits, refetchCredits } = useAICreditsGate();

const handleAIAction = async () => {
  if (!checkCredits()) return;
  
  try {
    await callAIEndpoint();
    refetchCredits(); // Update credits display
  } catch (error) {
    // handle error
  }
};
```

### Prompt 7.2: Log AI Usage in Edge Functions

```
In each edge function that calls an LLM, after the API call succeeds:

1. Insert a record into llm_usage_events:
   - user_id: from auth
   - idempotency_key: unique key (e.g., `${feature}_${userId}_${timestamp}`)
   - feature: name of the feature (e.g., 'refine_prompt')
   - model: the LLM model used
   - prompt_tokens, completion_tokens, total_tokens: from API response
   - credits_charged: total_tokens / tokens_per_credit (for historical reference)

2. Update ai_allowance_periods.tokens_used:
   - Increment by total_tokens consumed
   - Use the current period for the user

This creates an audit trail and decrements the user's balance.
```

---

## Step 8: Documentation Update

### Prompt 8.1: Update Schema Documentation

```
Update the docs/SCHEMA.md file to include documentation for:

1. ai_credit_settings table with all columns and default values
2. ai_allowance_periods table explaining the token-as-source-of-truth architecture
3. llm_usage_events table for the audit ledger
4. v_ai_allowance_current view with all calculated fields
5. Note that credits are NEVER stored, only calculated dynamically from tokens

Include a section explaining:
- Token-to-credit conversion is dynamic
- Changing tokens_per_credit affects all users immediately
- Rollover is capped at the plan's monthly allowance
- The cron job ensures periods are pre-created
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  useAICredits          - Fetches & calculates credits           │
│  useAICreditsGate      - Gates AI features by credit balance    │
│  CreditsDisplay        - Settings UI with progress bar          │
│  UserTokenModal        - Admin token management                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE FUNCTIONS                               │
├─────────────────────────────────────────────────────────────────┤
│  ensure-token-allowance  - Creates/returns allowance periods    │
│  [your-ai-features]      - Log usage to llm_usage_events        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
├─────────────────────────────────────────────────────────────────┤
│  ai_credit_settings      - Global config (tokens_per_credit)   │
│  ai_allowance_periods    - User monthly allowances (TOKENS)    │
│  llm_usage_events        - Audit log of all AI usage           │
│  v_ai_allowance_current  - View with calculated credits        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CRON JOB                                  │
├─────────────────────────────────────────────────────────────────┤
│  daily-token-allowance-reset (00:05 UTC)                        │
│  - Calls ensure-token-allowance with batch_init=true            │
│  - Pre-creates new periods for all users                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Principles

1. **Tokens are the source of truth** - Credits are always calculated dynamically
2. **Dynamic conversion** - Changing `tokens_per_credit` affects all users immediately
3. **Rollover capped** - Users can carry over up to their plan's monthly allowance
4. **Audit everything** - Every token change is logged to `llm_usage_events`
5. **Fail-safe resets** - Cron + lazy initialization ensures no user misses their allowance
6. **Premium gating** - AI features require both Premium plan AND remaining credits

---

## Customization Points

- **Plan tiers**: Adjust `credits_free_per_month` and `credits_premium_per_month`
- **Conversion rate**: Change `tokens_per_credit` to adjust credit "value"
- **Rollover cap**: Modify the rollover calculation in ensure-token-allowance
- **Warning threshold**: Change the 15% threshold in useAICredits
- **Preview window**: Adjust the 5-day rollover preview window in CreditsDisplay
