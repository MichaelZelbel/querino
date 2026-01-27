

# Fix: AI Credits Display Not Updating When Tokens Per Credit Changes

## Problem Analysis

When you change "Tokens per AI Credit" in the admin settings:
- The new value (2000) is saved to `ai_credit_settings.tokens_per_credit`
- However, existing `ai_allowance_periods` records still have the OLD `token_to_milli_credit_factor` value (5, from when 200 tokens = 1 credit)
- The frontend reads the factor from the period record, not from the global settings
- Result: Your displayed credits remain unchanged

**Example calculation with stored factor:**
- Your tokens: ~197,000 remaining
- Old factor (stored): 5
- Credits = 197,000 * 5 / 1000 = **985 credits** (what you see)

**What it should be with new factor:**
- New factor: 1000/2000 = 0.5
- Credits = 197,000 * 0.5 / 1000 = **98.5 credits**

## Solution

Modify the `useAICredits` hook to fetch the current `tokens_per_credit` from `ai_credit_settings` and use that for the conversion calculation, rather than relying on the stored `token_to_milli_credit_factor` in the period record.

## Implementation Steps

### Step 1: Update useAICredits Hook

Modify `src/hooks/useAICredits.ts` to:
1. Add `tokens_per_credit` to the settings query
2. Calculate the milli-credit factor dynamically from the current setting
3. Use this dynamic factor instead of the stored `token_to_milli_credit_factor`

```text
Changes to src/hooks/useAICredits.ts:

Line 50-52: Add 'tokens_per_credit' to the settings query
  .in("key", ["credits_free_per_month", "credits_premium_per_month", "tokens_per_credit"])

Line 78-81: Replace the stored factor with calculated factor
  // Get current tokens_per_credit from settings (default 200)
  const tokensPerCredit = settingsMap["tokens_per_credit"] || 200;
  // Calculate factor: 1000 milli-credits per credit / tokens per credit
  const tokenToMilliCreditFactor = 1000 / tokensPerCredit;
```

### Step 2: Update Settings Query

The `settingsMap` already uses the settings data, we just need to:
1. Include `tokens_per_credit` in the query
2. Use it to calculate the conversion factor

## Technical Details

**Before (problematic):**
```typescript
const tokenToMilliCreditFactor = Number(data.token_to_milli_credit_factor) || 5;
```
This reads the OLD factor stored in the period record.

**After (fixed):**
```typescript
// Add to settings query
.in("key", ["credits_free_per_month", "credits_premium_per_month", "tokens_per_credit"])

// Calculate from current settings
const tokensPerCredit = settingsMap["tokens_per_credit"] || 200;
const tokenToMilliCreditFactor = 1000 / tokensPerCredit;
```

## Expected Result

After this fix:
- Changing "Tokens per AI Credit" in admin will immediately affect the displayed credits
- With 2000 tokens/credit and ~197,000 remaining tokens: ~98 credits displayed
- With 200 tokens/credit (original): ~985 credits displayed

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAICredits.ts` | Fetch `tokens_per_credit` from settings and calculate factor dynamically |

