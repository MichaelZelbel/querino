

# Fix: Moderation System Not Blocking Content

## Root Cause

The `moderation_stopwords` table is **completely empty** (0 rows). The `moderate-content` edge function works correctly, but without any stopwords to match against, it always returns `{ approved: true }`. The ModerationBlockDialog never appears because the moderation check never fails.

There are also 0 rows in `moderation_events`, suggesting the function may not have been called successfully or event inserts silently failed.

## Fix

### 1. Seed the stopwords table with initial blocked terms

Create a database migration that inserts a curated set of common blocked terms across categories:

- **sexual** (~30-40 terms): explicit sexual/pornographic terms
- **hate** (~20-30 terms): slurs, hate speech terms
- **malware** (~10 terms): terms indicating malicious code instructions
- **spam** (~5 terms): common spam patterns

All terms stored lowercase. All with severity = "block".

### 2. Verify the edge function call chain

The client-side `moderateContent.ts` has a try/catch that fails-open (returns `approved: true` on any error). I will add a `console.warn` in the catch blocks so silent failures are visible in the console, making future debugging easier.

### 3. Test the flow end-to-end

After seeding, the flow should be:
1. User toggles public ON and clicks Save
2. `handleSaveChanges` calls `moderateContent(...)` 
3. Edge function matches stopwords against normalized content
4. Returns `{ approved: false, category: "...", support_hint: "..." }`
5. `setModerationBlock(result)` triggers the `ModerationBlockDialog`

## Files Changed

| File | Change |
|---|---|
| `supabase/migrations/[new]_seed_moderation_stopwords.sql` | INSERT ~70 initial stopwords |
| `src/lib/moderateContent.ts` | Add `console.warn` to catch blocks for visibility |

## Stopword Categories

The initial seed will include well-known explicit terms. The admin can manage these from **Admin > Moderation > Stopwords** and use bulk import for additions.

Note: This does NOT change any logic — the moderation system already works. It just needs data to work with.

