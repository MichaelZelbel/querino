
# Remove Active Stripe Calls While Preserving Data Structures

## Summary
Remove all runtime Stripe API calls and UI components that reference Stripe, while keeping the configuration files, types, and data structures intact so Stripe can be re-enabled later.

## What Changes

### 1. Edge Functions: Disable Stripe API calls

**`supabase/functions/check-subscription/index.ts`**
- Remove the Stripe SDK import and all `checkStripeAccount()` logic
- Simplify to: check `user_roles` table only (admin-controlled roles already bypass Stripe)
- For non-admin users, just return their current role from `user_roles` without querying Stripe
- Keep the same response shape so the frontend works unchanged
- Keep admin notification logic for role changes (but no Stripe-triggered changes will occur)

**`supabase/functions/create-checkout/index.ts`**
- Replace the function body with a simple response: `{ error: "Checkout is currently disabled. Contact support@querino.ai" }`
- Keep the file structure intact

**`supabase/functions/customer-portal/index.ts`**
- Same approach: return `{ error: "Billing portal is currently disabled. Contact support@querino.ai" }`
- Keep file structure intact

### 2. Frontend: Remove Stripe-specific UI

**`src/hooks/useSubscription.ts`**
- Remove Stripe mode logic (`getStripeMode()` calls)
- Simplify `checkSubscription` to call the edge function without a `mode` parameter
- Remove `openCustomerPortal` (or make it show a toast saying "Contact support")
- Remove localStorage-based mode listener
- Keep the same hook API shape (`isPremium`, `subscription`, etc.)

**`src/hooks/useStripeCheckout.ts`**
- Replace `createCheckoutSession` with a function that shows a toast: "Contact support@querino.ai to upgrade"
- Keep the hook export shape identical

**`src/components/stripe/StripeModeToggle.tsx`**
- Make it return `null` always (or remove the component)
- Keep the file so imports don't break

**`src/pages/Admin.tsx`**
- Remove the "Stripe Environment" card section (lines ~342-356)

**`src/pages/Settings.tsx`**
- Replace the "Manage Billing" button with a "Contact Support" mailto link
- Remove `openCustomerPortal` usage

**`src/components/pricing/PricingCards.tsx`**
- Remove `useStripeCheckout` import
- For the premium plan button, link to `mailto:support@querino.ai` instead of starting checkout

### 3. Files Kept Intact (for future re-enablement)
- `src/config/stripe.ts` -- all price IDs, product IDs, mode helpers preserved
- `src/types/profile.ts` -- plan_type and plan_source types unchanged
- `src/types/userRole.ts` -- AppRole type unchanged
- `user_roles` table -- no schema changes
- All Stripe secret keys remain configured in Supabase secrets
- `src/components/premium/usePremiumCheck.ts` -- unchanged, reads from `user_roles`

## Technical Details

The key insight is that `usePremiumCheck` (used everywhere for gating) reads from the `user_roles` table directly via `useUserRole`, not from Stripe. So premium gating continues to work based on admin-assigned roles. Only the automated Stripe-to-role sync is removed.

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/check-subscription/index.ts` | Remove Stripe SDK, return role from DB only |
| `supabase/functions/create-checkout/index.ts` | Return "disabled" message |
| `supabase/functions/customer-portal/index.ts` | Return "disabled" message |
| `src/hooks/useSubscription.ts` | Remove Stripe mode logic, simplify to DB-only check |
| `src/hooks/useStripeCheckout.ts` | Replace with "contact support" toast |
| `src/components/stripe/StripeModeToggle.tsx` | Return null |
| `src/pages/Admin.tsx` | Remove Stripe Environment card |
| `src/pages/Settings.tsx` | Replace "Manage Billing" with "Contact Support" |
| `src/components/pricing/PricingCards.tsx` | Remove checkout, use mailto instead |

### Files Preserved (no changes)
- `src/config/stripe.ts`
- `src/types/profile.ts`
- `src/types/userRole.ts`
- `src/components/premium/usePremiumCheck.ts`
- `src/components/premium/PremiumGate.tsx`
- Database schema (user_roles, profiles tables)
