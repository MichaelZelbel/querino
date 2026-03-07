

## Problem

The `translate-artifact` edge function defaults to `provider = "n8n"`, which proxies to `N8N_BASE_URL/webhook/translate-artifact`. That n8n workflow is not active (or not imported), so it returns HTTP 404.

## Options

### Option A: Activate the n8n workflow (no code change)
- Import `n8n/Translate Artifact.json` into your n8n instance
- Configure the Azure/OpenAI credentials and Header Auth
- Toggle the workflow **active**
- Translation will work immediately

### Option B: Fall back to Lovable AI Gateway (code change)
If you don't want to set up the n8n workflow right now, update the edge function to default to `"lovable"` instead of `"n8n"`:

**File: `supabase/functions/translate-artifact/index.ts`**
- Change line: `const provider = Deno.env.get("TRANSLATION_PROVIDER") || "n8n";`
- To: `const provider = Deno.env.get("TRANSLATION_PROVIDER") || "lovable";`

This uses the Lovable AI Gateway (Gemini-3-flash) directly, which requires only the `LOVABLE_API_KEY` secret (already configured).

One line change, then redeploy the edge function.

## Recommendation

Option B is the quickest fix. You can switch back to n8n later by setting the `TRANSLATION_PROVIDER` secret to `"n8n"` once the workflow is active.

