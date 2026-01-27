
# Fix: AI Credits Display Showing Incorrect Values

## Problems Identified

### Problem 1: "1,000 of 1,000" instead of actual values

Looking at the database for user Michael (`1f2cff11-1f32-4fde-960d-4cbbcac181cc`):

| Field | Value |
|-------|-------|
| `credits_granted` | 0 |
| `tokens_granted` | 200,000 |
| `remaining_tokens` | 200,000 |
| `token_to_milli_credit_factor` | 5 |
| `metadata.base_credits` | **NOT SET** (null) |
| `source` | `free_tier` (incorrect - user is Premium) |

**Calculation happening now:**
```
creditsGranted = (200,000 * 5) / 1000 = 1,000
remainingCredits = (200,000 * 5) / 1000 = 1,000
baseCredits = metadata?.base_credits || creditsGranted = 1,000 (falls back to creditsGranted)
```

**The root cause is TWO issues:**
1. The `ensure-token-allowance` function created this period with `source: "free_tier"` instead of `"subscription"` (it's reading the wrong plan type)
2. The `metadata.base_credits` is not set because this period was created BEFORE rollover was implemented

### Problem 2: "Up to 1,000 credits rollover" is incorrect

The `maxRollover` is set to `planBaseCredits`, which falls back to `baseCredits`, which falls back to `creditsGranted` (the calculated 1,000). It should be based on the **user's actual plan allowance** (1,500 for Premium), not the current period's data.

---

## Solution

### Part 1: Fix the `useAICredits` hook to fetch plan credits

The hook should fetch the user's plan type and use the global `ai_credit_settings` to determine the correct base credits:

```typescript
// Fetch user's plan type from profile
const { data: profileData } = await supabase
  .from("profiles")
  .select("plan_type")
  .eq("id", user.id)
  .maybeSingle();

// Fetch credit settings
const { data: settings } = await supabase
  .from("ai_credit_settings")
  .select("key, value_int")
  .in("key", ["credits_free_per_month", "credits_premium_per_month"]);

// Determine plan base credits
const isPremium = profileData?.plan_type === "premium";
const planBaseCredits = isPremium 
  ? settings?.find(s => s.key === "credits_premium_per_month")?.value_int || 1500
  : settings?.find(s => s.key === "credits_free_per_month")?.value_int || 0;
```

### Part 2: Clarify the rollover display

The "Up to X credits rollover" message should be **static** and show the **maximum possible rollover** (which is the plan's monthly credits). This is informational - it tells the user "you can roll over up to X credits to next month."

It should NOT change based on remaining credits - it's a plan feature, not current balance.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAICredits.ts` | Fetch user's plan type and credit settings to determine the correct `baseCredits` value |
| `src/components/settings/CreditsDisplay.tsx` | Minor cleanup to ensure clarity |

---

## Technical Details

### Updated useAICredits.ts

```typescript
interface AICreditsData {
  // ... existing fields
  planBaseCredits: number;  // NEW: The plan's monthly credits (1500 for Premium)
}

const fetchCredits = useCallback(async () => {
  // ... existing ensure-token-allowance call
  
  // Fetch user's plan type
  const { data: profileData } = await supabase
    .from("profiles")
    .select("plan_type")
    .eq("id", user.id)
    .maybeSingle();
  
  // Fetch credit settings
  const { data: settingsData } = await supabase
    .from("ai_credit_settings")
    .select("key, value_int")
    .in("key", ["credits_free_per_month", "credits_premium_per_month"]);
  
  // Determine plan base credits from settings
  const isPremium = profileData?.plan_type === "premium";
  const settingsMap = Object.fromEntries(
    (settingsData || []).map(s => [s.key, s.value_int])
  );
  const planBaseCredits = isPremium 
    ? settingsMap["credits_premium_per_month"] || 1500
    : settingsMap["credits_free_per_month"] || 0;
  
  // ... rest of fetch logic
  
  setCredits({
    // ... existing fields
    baseCredits: metadata?.base_credits || planBaseCredits,  // Use plan credits as fallback
    planBaseCredits,  // NEW: Always the plan's monthly value
  });
});
```

### Updated CreditsDisplay.tsx

```typescript
const { creditsGranted, remainingCredits, rolloverCredits, periodEnd, baseCredits, planBaseCredits } = credits;

// Use the plan's base credits for rollover cap and reset display
const maxRollover = planBaseCredits;

// For the progress bar, use creditsGranted (which includes rollover)
// ...existing logic
```

---

## Expected Outcome

After this fix:
- **Header**: "AI Credits remaining 1,000 of 1,000" will still show correctly (user has 1,000 calculated credits from 200k tokens)
- **Rollover line**: "Up to 1,500 credits rollover" (from plan settings, not current balance)
- **Reset line**: "1,500 credits reset on [date]" (from plan settings)

The rollover amount is **always static** based on the plan tier - it tells users the maximum they can carry forward, not how much they currently have.
