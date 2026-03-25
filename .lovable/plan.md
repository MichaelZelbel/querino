

## Transliterate Non-Latin Slugs to Latin

### Problem
Non-Latin titles (Arabic, Chinese, Hindi) produce Unicode slugs that get URL-encoded into unreadable strings like `%D9%85%D9%88%D8%AC%D9%91%D9%87-...`.

### Strategy
Move slug generation for non-Latin titles to a Supabase Edge Function that uses a JavaScript transliteration library (`npm:transliteration`), then pass the pre-generated slug to the database on insert. The DB trigger already skips slug generation when a slug is provided.

### Implementation

**Step 1: Create `generate-slug` edge function**
- New file: `supabase/functions/generate-slug/index.ts`
- Uses `transliterate` from `npm:transliteration` to convert any script to Latin
- Applies the same normalization rules as the DB function (lowercase, hyphenate, collapse, trim)
- Falls back to `untitled-{shortId}` if result is empty
- No auth required -- lightweight utility

**Step 2: Create a frontend hook `useGenerateSlug`**
- New file: `src/hooks/useGenerateSlug.ts`
- Calls the edge function with a title, returns a clean Latin slug
- Used before prompt/skill/workflow/claw creation

**Step 3: Update creation pages to pre-generate slugs**
- `PromptNew.tsx`: Before inserting, call `useGenerateSlug(title)` and pass the resulting slug in the insert payload
- Same for `SkillNew.tsx`, `WorkflowNew.tsx`, `ClawNew.tsx`
- The DB trigger (`set_prompt_slug`) already has: "if slug is provided, don't overwrite" -- so this just works

**Step 4: Update TranslateModal to pre-generate slug**
- After translation completes, call the slug edge function with the translated title
- Pass the slug as a query param to the `/prompts/new` page so it gets used on insert

**Step 5: Update `SlugEditor` manual editing**
- When a user manually edits a slug, also run it through the edge function for normalization (transliteration + cleanup) before calling `update_prompt_slug` RPC

**Step 6: Update `update_prompt_slug` DB function**
- The existing `generate_slug` SQL function stays as a fallback for any insert without a pre-generated slug
- No changes needed to the DB function -- it already produces `untitled-{shortId}` for non-Latin text that it can't handle

### Example Results
| Input Title | Current Slug | New Slug |
|---|---|---|
| موجّه النقد الذاتي | موجّه-النقد-الذاتي (URL-encoded mess) | `muwajjih-an-naqd-adh-dhati` |
| 你好世界 | 你好世界 (URL-encoded) | `ni-hao-shi-jie` |
| आत्म-समीक्षा | आत्म-समीक्षा (URL-encoded) | `aatm-samiiksha` |
| autocrítica | autocritica | `autocritica` (unchanged) |

### Technical Details
- `npm:transliteration` is available natively in Deno via npm specifier
- The edge function is stateless and fast (no DB calls, no AI)
- Existing prompts keep their current slugs -- no migration of existing data
- The DB `generate_slug` function remains as the safety net fallback

### Files to Create/Modify
- **Create**: `supabase/functions/generate-slug/index.ts`
- **Create**: `src/hooks/useGenerateSlug.ts`
- **Modify**: `src/pages/PromptNew.tsx` -- call slug generation before insert
- **Modify**: `src/pages/SkillNew.tsx` -- same
- **Modify**: `src/pages/WorkflowNew.tsx` -- same
- **Modify**: `src/pages/ClawNew.tsx` -- same
- **Modify**: `src/components/shared/TranslateModal.tsx` -- pass slug param
- **Modify**: `src/components/prompts/SlugEditor.tsx` -- transliterate on manual edit

