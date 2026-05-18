## Fixing the three Google Search Console issues

Google sent you three separate notices. Two we can pinpoint and fix in code; the third (1 page blocked with 401) is too vague without the URL — I'll mitigate it and tell you what to check in GSC.

---

### 1. Product structured data missing `offers` / `review` / `aggregateRating` ✅ fixable

**Where it comes from.** `src/pages/PromptDetail.tsx` injects a JSON-LD block with `@type: "Product"`. Google's Product rich-result requires one of `offers`, `review`, or `aggregateRating`. Prompts aren't products for sale, so the right fix is to stop claiming Product.

**Change.** In `src/pages/PromptDetail.tsx`:
- Switch `@type` from `"Product"` to `"CreativeWork"` (the schema.org type for an authored piece of content like a prompt). This silences Google's Product validator entirely.
- Drop the `brand` field (it belongs on Product).
- Add `aggregateRating` conditionally when `prompt.rating_count > 0`, populated from `rating_avg` / `rating_count`. This gives us a richer snippet where data exists, without requiring it.
- Add `datePublished` / `dateModified` from `created_at` / `updated_at`.

No other artifact detail page uses Product JSON-LD, so this single edit clears the warning.

---

### 2. Soft 404 (≈9 pages) ✅ fixable

**Where it comes from.** Our SPA returns HTTP 200 for every URL (Vite serves `index.html` for any path), then React renders one of:
- `src/pages/NotFound.tsx` for unknown routes
- "Prompt Not Found" / "Skill Not Found" / "Workflow Not Found" / "Prompt Kit Not Found" branches when an artifact is missing, deleted, or private

Google sees HTTP 200 + "not found" copy and flags **Soft 404**.

We can't return real 404 status from a static-hosted SPA, but Google honors `<meta name="robots" content="noindex">` on those pages — that's the documented Soft-404 remedy.

**Change.**
- `src/pages/NotFound.tsx` — add `<SEOHead title="Page Not Found" noIndex />` and a real `<main>` wrapper.
- `src/pages/PromptDetail.tsx`, `src/pages/SkillDetail.tsx`, `src/pages/WorkflowDetail.tsx`, `src/pages/PromptKitDetail.tsx` — render `<SEOHead title="… Not Found" noIndex />` inside each `notFound || !item` branch.

`SEOHead` already supports the `noIndex` prop (writes `<meta name="robots" content="noindex, nofollow">`), so this is purely additive.

---

### 3. Blocked due to unauthorized request (401), 1 page ⚠️ partial / needs your input

**Where it likely comes from.** Only 1 URL is affected, and the GSC email doesn't say which. The most likely candidates on our setup:
- A direct Supabase Edge Function URL that Google discovered via a link or HTTP referer (most edge functions require an `apikey` / `Authorization` header → 401 to an anonymous crawler). Our `api` function is the one explicitly `verify_jwt = false` (so `/sitemap.xml` returns 200), but any of the other 25+ functions would return 401 if Google ever tried to crawl them.
- A historical link to a now-removed page that briefly proxied through an auth-gated endpoint.

**What I'll do regardless (low-cost mitigation):**
- Tighten `public/robots.txt` to `Disallow:` private app surfaces so Google stops trying to crawl them: `/library`, `/settings`, `/admin`, `/studio`, `/collections/new`, `/prompts/new`, `/skills/new`, `/workflows/new`, `/prompt-kits/new`, and any per-user edit routes. These render fine with HTTP 200 today but are useless in search and several would 401 against backend calls.
- Remove `/auth` from the sitemap in `supabase/functions/api/index.ts` (login pages shouldn't be advertised for indexing).

**What I need from you to fully kill the 401:** open Search Console → **Indexing → Pages → "Blocked due to unauthorized request (401)"** and copy the offending URL into the chat. With the URL I can either remove the inbound link, set the right CORS/JWT on the function, or add a redirect.

---

## Files I will touch (build phase)

| File | Change |
|---|---|
| `src/pages/PromptDetail.tsx` | Swap JSON-LD `Product` → `CreativeWork`, add conditional `aggregateRating`, `datePublished`, `dateModified`; drop `brand` |
| `src/pages/NotFound.tsx` | Add `<SEOHead noIndex>` + `<main>` |
| `src/pages/SkillDetail.tsx` | Add `<SEOHead noIndex>` in the not-found branch |
| `src/pages/WorkflowDetail.tsx` | Same |
| `src/pages/PromptKitDetail.tsx` | Same |
| `public/robots.txt` | Disallow private app routes |
| `supabase/functions/api/index.ts` | Drop `/auth` from the sitemap's static pages |

## What won't change

- The sitemap itself stays at the Supabase function URL — it returns 200 fine and Google reads it.
- `index.html` head, canonical, and Organization JSON-LD stay as they are.
- No new dependency (no `react-helmet-async`) — we already have a working `SEOHead` component.

## Verifying after the build

1. After republish, in GSC click **Validate Fix** on each of the three notices.
2. Use the **URL Inspection** tool on a prompt detail page → "Test live URL" → "View tested page" → "More info" → "JavaScript console messages" should show no Product warning.
3. Use the **Rich Results Test** (https://search.google.com/test/rich-results) on `https://querino.ai/prompts/<some-slug>` to confirm the JSON-LD is now CreativeWork and validates.

Google typically takes 1–2 weeks to revalidate at scale.
