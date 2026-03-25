

## Fix: generate-slug Edge Function Not Deploying

### Root Cause
The `generate-slug` edge function uses `npm:transliteration@2.3.5` as a bare npm specifier, but without a `deno.json` declaring it as a dependency, the Deno edge runtime can't resolve it. The function fails to deploy, so transliteration never runs. The frontend `useGenerateSlug` hook catches the error and falls back to a basic client-side slug (which preserves Chinese/Arabic characters as-is), resulting in URL-encoded slugs like `%E8%87%AA%E6%88%91...`.

### Fix

**Add `supabase/functions/generate-slug/deno.json`** with the npm dependency declared:

```json
{
  "imports": {
    "transliteration": "npm:transliteration@2.3.5"
  }
}
```

**Update `supabase/functions/generate-slug/index.ts`** line 2 to import from the mapped name:

```typescript
import { transliterate } from "transliteration";
```

This matches the pattern used by `mcp-server/deno.json` for its npm dependencies.

### Files
- **Create**: `supabase/functions/generate-slug/deno.json`
- **Modify**: `supabase/functions/generate-slug/index.ts` (line 2 import)

### Note
The `mcp-server` TS errors in the build log are pre-existing and unrelated to this fix.

