# GSC "Soft 404" + "Excluded by noindex" — verdict, fix, and stack question

## What the 11 URLs actually are

Verified against the code:

| Group | URLs | Status |
|---|---|---|
| Legacy UUID artifact URLs | 8 of 11 (`/prompts/<uuid>`, `/skills/<uuid>`, `/workflows/<uuid>`) | **Real, fixable loss.** `PromptDetail`/`SkillDetail`/`WorkflowDetail` look the record up by `slug` only (`.eq("slug", slug)`), then fall back to the `*_slug_redirects` table. A UUID matches neither, so the page renders the "not found" branch — which we recently gave `noIndex`. These artifacts still exist; Google just can't reach them anymore and the accumulated link equity is being thrown away. |
| `/pricing` | 1 | **Intentional.** We deleted the page on purpose. Nothing to fix. |
| `/prompts/export-everything-an-ai-knows-about-you-hub-import` | 1 | Either deleted or renamed without a redirect row. Needs a one-off check. |
| `/discover?tag=ide` | 1 | Facet URL with no server-rendered content. Intentional to leave out of the index. |

So: the `noindex` half is working as designed, and the Soft 404 half is **one real bug** (UUID URLs no longer resolve) plus expected noise.

## Recommendation: fix now on the current stack, migrate separately

These are two independent decisions. The UUID fix is small and does not depend on the stack; do it first so the migration is not on the critical path for recovering those URLs.

### Fix on the current stack (small)
1. In each of the four detail pages, when the route param matches a UUID, look the artifact up by `id` instead of `slug`, then `navigate(/<route>/<slug>, { replace: true })`. This turns 8 dead URLs into working canonical pages.
2. Check the one dead slug against the DB; if the prompt exists under a new slug, insert the missing `prompt_slug_redirects` row.
3. Leave `/pricing`, `/discover?tag=*`, and all existing `noindex` tags exactly as they are.

Client-side redirects are not as strong as a server 301, but Google follows them and consolidates the signal, and it removes the Soft 404 classification entirely.

## Your real question: what can the TanStack migration break?

Honest answer, per area:

**Edge functions — no risk.** `supabase/functions/**` is not touched by the migration. Your 34 functions, `config.toml`, and `supabase/migrations/**` stay exactly where they are and keep being deployed the same way. The migration only rewrites the frontend framework files.

**The MCP server — no risk.** It is a Supabase edge function (`supabase/functions/mcp-server`) on your own Supabase project, reached via `mcp.querino.ai`. Nothing in the frontend migration touches it.

**The API — no risk.** `supabase/functions/api` (sitemap + RSS) and `blog-api` are likewise untouched. Note the new stack *can* serve a sitemap natively, which would let you eventually retire the Cloudflare Worker proxy — but that is optional cleanup, not part of the migration.

**The user interface — this is where the real risk sits.** Concretely:
- Every page moves from `src/App.tsx` routes to per-file routes under `src/routes/`. ~45 routes, plus your auth guards, all get re-generated.
- TypeScript goes from loose to `strict`. Your `tsconfig` currently has `noImplicitAny: false`; the migration flips it on and produces a large error wave that has to be worked through.
- Tailwind v3 → v4. Custom tokens in `src/index.css` are ported by hand; a missed token is a silent visual regression that no build check catches.
- `SEOHead` mutates the DOM in `useEffect`; on SSR that pattern needs revisiting anyway (which is exactly the SEO upside).
- Browser-only assumptions (`window`, `localStorage` at module scope) now run on the server and must be guarded.

**Can it be repaired if it goes wrong?** Yes — the migration lands as a single chat turn and can be reverted from chat history, which restores the code *and* flips publishing back to the current pipeline. Your database, edge functions, and published domain are unaffected by a revert. The realistic failure mode is not "unrecoverable", it is "several hours of chasing type errors and visual regressions".

### Suggested sequencing
1. **Now:** ship the UUID-redirect fix + the one missing slug redirect. Recovers the 8 URLs within a crawl cycle.
2. **Then:** decide on the migration as its own project, with time budgeted for the strict-TS wave and a careful visual pass. Given organic search is a Q-priority, the SSR upside (real 404/410 status codes, server-rendered titles/canonicals/JSON-LD for the whole artifact catalogue) is worth it — but it should not be rushed as a reaction to this email.

## Technical detail for step 1

- UUID detection: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` on the `slug` route param.
- Files: `src/pages/PromptDetail.tsx`, `SkillDetail.tsx`, `WorkflowDetail.tsx`, `PromptKitDetail.tsx` — each already has the slug-redirect fallback block to extend.
- Only redirect when the record is publicly visible; otherwise keep the existing `noIndex` not-found branch.
