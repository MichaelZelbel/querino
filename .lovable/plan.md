
# Fix: Admin Panel "Remaining Tokens" Column Not Showing Data

## Problem Identified

The "Remaining tokens" column shows "—" for all users because of a **mismatch between the Edge Function response format and what the Admin page expects**.

### Root Cause Analysis

**Edge Function `ensure-token-allowance` returns (batch mode):**
```json
{
  "results": [
    { "user_id": "abc-123", "created": false },
    { "user_id": "def-456", "created": true }
  ]
}
```

**Admin.tsx expects:**
```typescript
if (result.status === "exists" || result.status === "created") {
  const balance = result.balance;  // Missing from response!
  allowanceMap[result.userId] = { ... };  // Wrong key name!
}
```

**Three specific issues:**
1. Edge function returns `created: boolean`, but Admin.tsx checks for `status: "exists" | "created"`
2. Edge function returns `user_id`, but Admin.tsx looks for `userId`
3. **Most critically:** In batch mode, the edge function does NOT return the `allowance` data—only `{ user_id, created, error? }`

---

## Solution

Update BOTH the Edge Function and the Admin page to align their data contracts:

### Part 1: Update Edge Function (ensure-token-allowance)

Modify the batch mode response to include the balance/allowance data for each user:

```typescript
// Instead of:
results.push({ user_id: profile.id, created: result.created });

// Return:
results.push({ 
  userId: profile.id,  // Use camelCase for consistency
  status: result.created ? "created" : "exists",
  balance: result.allowance  // Include the allowance data
});
```

### Part 2: Update Admin.tsx (optional cleanup)

Alternatively, update Admin.tsx to match the current edge function response format. But since the edge function doesn't return balance data in batch mode anyway, the edge function must be updated.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/ensure-token-allowance/index.ts` | Update batch response to include `status`, `userId`, and `balance` fields |

---

## Technical Details

### Edge Function Changes

In the batch loop (around lines 304-315), change:

**Before:**
```typescript
for (const profile of profiles || []) {
  try {
    const result = await ensureTokenAllowance(supabaseAdmin, profile.id);
    results.push({ user_id: profile.id, created: result.created });
  } catch (err) {
    results.push({ 
      user_id: profile.id, 
      created: false, 
      error: err instanceof Error ? err.message : String(err) 
    });
  }
}
```

**After:**
```typescript
for (const profile of profiles || []) {
  try {
    const result = await ensureTokenAllowance(supabaseAdmin, profile.id);
    results.push({ 
      userId: profile.id,  // camelCase to match frontend expectation
      status: result.created ? "created" : "exists",
      balance: result.allowance  // Include the balance data
    });
  } catch (err) {
    results.push({ 
      userId: profile.id, 
      status: "error",
      error: err instanceof Error ? err.message : String(err) 
    });
  }
}
```

This ensures the Admin page receives the balance data it needs to populate the "Remaining tokens" column.

---

## Expected Outcome

After this fix:
- The "Remaining tokens" column will display actual token balances for each user
- Admins can inline-edit remaining tokens and save changes
- The data will load correctly on page load via the batch initialization
