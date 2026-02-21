

# Cap Free Account Signups

## Problem
Every free account gets AI tokens you subsidize. Without a cap, an attacker (or organic growth past your budget) could create unlimited accounts and burn through your Azure LLM budget.

## Approach

### 1. New setting in `ai_credit_settings`

Add a `max_free_accounts` row (value: 1000) so you can adjust the cap from the Admin panel without code changes.

### 2. New database function: `check_signup_allowed()`

A simple RPC that counts rows in `profiles` and compares to the `max_free_accounts` setting. Returns `{ allowed: boolean, current_count: integer, max_count: integer }`.

### 3. Gate email signups (frontend)

In `src/hooks/useAuth.ts`, call `check_signup_allowed()` before `supabase.auth.signUp()`. If not allowed, return an error: "We've reached our early access limit. Join the waitlist at support@querino.ai."

### 4. Gate OAuth signups (post-login check)

OAuth redirects can't be blocked before they happen. Instead, after an OAuth login completes in `useAuth.ts`, check if the user's profile was just created (within the last 60 seconds) AND if we're over the limit. If so:
- Show a "waitlist" toast message
- Sign the user out
- The profile/user_roles row already exists but they can't use the app

### 5. Admin visibility

Add `max_free_accounts` to the `AICreditSettings` component so you can see and adjust the cap. Also show the current user count.

## Technical Details

### SQL Migration

```sql
-- New setting
INSERT INTO ai_credit_settings (key, value_int, description)
VALUES ('max_free_accounts', 1000, 'Maximum number of free accounts allowed before signups are closed');

-- RPC function
CREATE OR REPLACE FUNCTION public.check_signup_allowed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT COUNT(*)::integer INTO current_count FROM public.profiles;
  SELECT COALESCE(
    (SELECT value_int FROM public.ai_credit_settings WHERE key = 'max_free_accounts'),
    1000
  ) INTO max_count;
  
  RETURN jsonb_build_object(
    'allowed', current_count < max_count,
    'current_count', current_count,
    'max_count', max_count
  );
END;
$$;
```

### Files Modified

| File | Change |
|------|--------|
| SQL migration | Add setting row + `check_signup_allowed()` RPC |
| `src/hooks/useAuth.ts` | Call RPC before email signup; post-login check for OAuth |
| `src/pages/Auth.tsx` | Show "signups closed" state when over limit |
| `src/components/admin/AICreditSettings.tsx` | Add `max_free_accounts` to the settings list |

### What happens when the cap is reached

- **Email signup**: User sees "We've reached our early access limit" message directly on the signup form. The Supabase `signUp` call is never made.
- **OAuth signup**: User completes OAuth but is immediately signed out with a toast explaining the limit. Their auth record exists but they cannot access the app.
- **Existing users**: Unaffected. Only new signups are blocked.
- **Admin override**: You can raise `max_free_accounts` from the Admin panel at any time to let more users in.
