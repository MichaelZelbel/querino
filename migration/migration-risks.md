# What was deliberately not fixed, and what the migration has to do about it

Everything here was found, measured, and left alone on purpose. Preparation is supposed
to remove hazards without changing behaviour; each of these would have changed behaviour,
required a product decision, or cost more than it saved.

Severity is about the migration, not about the app in general, with one exception at the
top that is about the app right now.

---

## HIGH — the public site is already down, and this is not the migration's fault

**File:** `supabase/migrations/20260823174224_*.sql`
**Issue:** `REVOKE SELECT ON public.profiles FROM anon` with no matching grant back. Every
public detail page fails with `42501`, renders "Not Found", and emits `noindex, nofollow`.
`/discover` shows "Failed to load prompts" and lists nothing.
**What the migration must do:** nothing. **What Michael must do:** decide on the grant in
`migration/URGENT-public-pages-are-404.md`. Migrating a broken public surface onto a new
framework migrates the breakage, and the SSR upside of the whole exercise is worth
nothing while the pages a crawler reaches say "do not index me".

---

## HIGH — the Prompt type promises six things the database does not

**File:** `src/types/prompt.ts`, consumed in ~40 components
**Issue:** `slug`, `rating_avg`, `rating_count`, `copies_count`, `is_public` and
`created_at` are declared non-null. The `prompts` table allows NULL on all six. Measured:
aligning the type produces **25 further strict-mode errors**, and the honest fix for most
of them is a product decision, chiefly what a prompt with no slug should link to.
**Why not fixed:** it is a refactor with user-visible consequences, not preparation. One
documented cast now carries it, in `src/pages/UserProfile.tsx`, with the reasoning inline.
**What the migration must do:** nothing, but do not let it "fix" this by widening the type
mid-migration, or the 25 errors arrive mixed in with the route rewrite.

---

## HIGH — the whole SEO layer is a side effect and produces nothing without JavaScript

**File:** `src/components/seo/SEOHead.tsx`
**Issue:** it renders `null` and writes title, description, Open Graph, Twitter cards,
canonical, the RSS link and JSON-LD into `document.head` from a `useEffect`. A crawler
that does not execute JavaScript sees only what is hard-coded in `index.html`. Captured
evidence: 53 routes share **10 distinct titles**, only 9 carry a canonical URL, and the
structured data is identical `Organization` + `WebSite` on every single route.
**Why not fixed:** rebuilding it now, against a framework that is not here yet, is the
one change most likely to be thrown away.
**What the migration must do:** move every field in `migration/seo-inventory.md` into
TanStack route metadata, then re-run
`npx playwright test --config=playwright.baseline.config.ts seo-inventory` and diff
`seo-inventory.json`. Nothing may go missing, and canonical URLs must stop depending on
which host served the page.

---

## MEDIUM — Tiptap is imported statically into two editor pages

**Files:** `src/components/editors/PromptKitRichEditor.tsx`, imported directly by
`src/pages/PromptKitEdit.tsx` and `PromptKitNew.tsx`
**Issue:** Tiptap and ProseMirror are a 578 kB chunk that touch the DOM during
initialisation. Today they are only split because the *pages* are lazy. Under SSR those
pages render on the server and the editor initialises where there is no DOM.
**Why not fixed:** wrapping it client-only is a real change to how the editor mounts, and
it should be done against the framework that will host it.
**What the migration must do:** mount the editor client-only, and keep the
`.ProseMirror` CSS block in `index.css` (see the visual checklist).

---

## MEDIUM — the canonical URL still follows whichever host served the page

**File:** `src/config/site.ts`
**Issue:** `siteOrigin()` prefers `window.location.origin` when there is a window, which
is what preserves current behaviour exactly. It also preserves the existing flaw: a page
served from a preview host publishes canonical URLs pointing at that preview host.
**Why not fixed:** changing it changes what the app publishes, which is a product
decision. **What the migration must do:** on the server the fallback already applies, so
SSR resolves this on its own. Set `VITE_SITE_ORIGIN` and consider dropping the window
branch entirely once nothing renders client-only.

---

## MEDIUM — SEOHead re-runs its whole effect on every render

**File:** `src/components/seo/SEOHead.tsx`, dependency array
**Issue:** `jsonLd` is passed as an object literal from every caller, so it is a new
reference on each render and the effect re-runs, tearing down and rebuilding the JSON-LD
script tags each time.
**Why not fixed:** harmless today, and the file is being replaced anyway.
**What the migration must do:** the problem disappears if metadata becomes route data
instead of an effect. If any of it stays an effect, memoise.

---

## LOW — five `import.meta.env` sites, all with hard-coded fallbacks

**Files:** `src/integrations/supabase/client.ts` (2), `src/config/stripe.ts` (1),
`src/lib/notifications.ts` (1), `src/components/prompts/TestPromptModal.tsx` (1), plus
the new `src/config/site.ts`.
**Issue:** Vite-specific. Two of the five are `import.meta.env.DEV`.
**Why not centralised:** five sites is not enough coupling to justify an indirection
layer, and the Supabase client already falls back to literals so it works with no
environment at all.
**What the migration must do:** translate each to the new build's equivalent. `DEV` is the
one to look at twice, because it decides Stripe sandbox versus live mode.

---

## LOW — `src/main.tsx` reads `document.getElementById` at module scope

**Issue:** the one remaining module-scope browser access in the codebase, out of 146
occurrences scanned.
**Why not fixed:** it is the client entry point. The migration replaces this file.

---

## LOW — recharts is a dependency nothing imports

**File:** `src/components/ui/chart.tsx` is the only importer, and no file imports
`chart.tsx`.
**Why not fixed:** unrelated cleanup. **What the migration must do:** nothing. Worth
deleting afterwards; it is a shadcn component that was scaffolded and never used.

---

## Blind spots in the baseline itself

Honest limits of the evidence, so nobody reads more into it than it carries:

- **13 of 53 screenshot URLs use a synthetic parameter value.** Prompt kits, collections,
  profiles and blog posts are empty or unreadable for a logged-out visitor, so those
  screenshots baseline the not-found branch rather than a populated page. They are still
  a valid before-and-after, just not of content.
- **8 URLs use real slugs from the sitemap, and they currently render "Not Found"**
  because of the outage at the top of this file. Once it is fixed, re-take the baseline
  for those eight, or the post-migration comparison will compare two error pages.
- **Every screenshot is the logged-out view.** No authenticated route was photographed
  with a session, so nothing behind sign-in is covered. The routing contract covers those
  by hand instead.
- **The noise floor is 3 images out of 106.** Two runs of identical code differ in
  `admin@desktop`, `collections_id_edit@mobile` and `root@desktop`, because those pages
  render live data. A post-migration diff of three or fewer files, and those three, means
  nothing changed.
- **The edge functions were not touched or tested.** `npm test` covers them over HTTP and
  was green apart from one rate-limited call; that is the extent of the check.
