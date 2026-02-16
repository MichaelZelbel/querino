

## Fix: "Alternate page with proper canonical tag" Google Indexing Error

### Root Cause

Every page on your site is telling Google: "I'm just an alternate version of the homepage." This happens because:

- `index.html` contains a hardcoded `<link rel="canonical" href="https://querino.app" />` that ships with every page
- Google reads this from the raw HTML before JavaScript runs, so the dynamic override in `SEOHead` is ignored
- Google then skips indexing those pages because it thinks they're duplicates of the homepage

### Changes

**1. Remove hardcoded canonical from `index.html`**
- Delete the line `<link rel="canonical" href="https://querino.app" />`
- The canonical will be managed entirely by the `SEOHead` component at runtime

**2. Update `SEOHead` to always set a canonical URL**
- When no explicit `canonicalUrl` is provided, default to the current page URL (cleaned of query params where appropriate)
- This ensures every page declares itself as the canonical version
- Pages that already pass `canonicalUrl` (blog pages) continue working as before

**3. Fix the `notify-admin` build error (bonus)**
- The Resend import `npm:resend@4.0.0` is failing in Deno. Switch to using the Resend REST API directly via `fetch`, which is the standard pattern for Supabase Edge Functions and requires no external dependency.

### Technical Details

#### `index.html`
- Remove line 13: `<link rel="canonical" href="https://querino.app" />`

#### `src/components/seo/SEOHead.tsx`
- Change the canonical logic from "set if provided, remove if not" to "always set"
- Default: `canonicalUrl || window.location.origin + window.location.pathname`
- This strips query parameters by default (e.g., `?page=2`) to avoid duplicate canonical URLs for paginated views

#### `supabase/functions/notify-admin/index.ts`
- Replace the `npm:resend` import with a direct `fetch` call to `https://api.resend.com/emails`
- This eliminates the Deno module resolution error while maintaining identical functionality

