

# Move Admin Email to Supabase Secret

## Changes

1. **Add Supabase secret** `ADMIN_EMAIL` with value `michael@zelbel.de`
2. **Update `supabase/functions/notify-admin/index.ts`**:
   - Remove hardcoded `const ADMIN_EMAIL = "michael@zelbel.de"`
   - Read from `Deno.env.get("ADMIN_EMAIL")` with fallback to `michael@zelbel.de`
   - Change `FROM_EMAIL` from `"Querino <noreply@querino.ai>"` to `"Querino <support@querino.ai>"`
3. **Also update `supabase/functions/ai-moderate-content/index.ts`** — check if it has a hardcoded admin email for violation notifications and apply the same pattern
4. **Redeploy** both edge functions

## Result

You can change the admin notification recipient anytime via Supabase secrets without redeploying code.

