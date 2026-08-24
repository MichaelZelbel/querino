# Bring the sitemap and the RSS feed into the app, then retire the Cloudflare rewrite

Paste this whole file into a new Claude Code session in `c:\hub\dev\querino`.

You can do everything here yourself except one step in the Cloudflare dashboard, which is
Michael's to click and comes last, after the app is already serving the replacement. Do
not touch Cloudflare yourself and do not ask him to click anything before Phase 3 passes.

---

## What is wrong, measured 2026-08-24

Do not re-derive these. Re-check them only if something below does not match.

- **`public/robots.txt` line 34** points Google at a foreign domain:
  `Sitemap: https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/api/sitemap.xml`.
  A cross-domain sitemap needs the other host verified in Search Console, and it means
  the `querino.ai/sitemap.xml` route nobody is using is the one that actually works.
- **The RSS feed 404s on every URL the site advertises.** The blog pages emit
  `<link rel="alternate" type="application/rss+xml" href="https://querino.ai/api/rss.xml">`
  (from `pageHead({ rss: true })` in `src/lib/seo.ts`), and:

      querino.ai/rss.xml       404
      querino.ai/api/rss.xml   404
      querino.ai/sitemap.xml   200 application/xml

  The Cloudflare rewrite covers `/sitemap.xml` and nothing else.
- **The edge function serves both correctly**, just on the wrong host and with the wrong
  content type for the sitemap:

      .../functions/v1/api/sitemap.xml  200 text/plain
      .../functions/v1/api/rss.xml      200 application/rss+xml

  So the Cloudflare rewrite is also doing content-type correction, not only proxying.
- **The app serves neither.** `/sitemap.xml`, `/rss.xml`, `/api/sitemap.xml` and
  `/api/rss.xml` all 404 against the local production build. There is no `src/routes/api`
  and no `createServerFileRoute` anywhere. TanStack Start can do this; the migration did
  not build it.
- Both sources currently produce **102 URLs** and identical content.

## The decision, and why

**Serve both from the app, then remove the Cloudflare rewrite.** Not a second rewrite.

- One origin instead of three hops. Today a crawler asking for the sitemap reaches
  Cloudflare, which proxies Supabase, which queries Postgres, and something in the middle
  rewrites the content type. That is three places to look when it breaks.
- The logic ends up in the repository, where it is reviewable, testable and deployed by
  the same pipeline as everything else. Right now it lives in an edge function that no
  test covers.
- The content type is right at the source, so nothing has to correct it downstream.
- It removes a manual dashboard step from the system rather than adding a second one.
- The migration was done to gain exactly this capability. This is the first thing that
  actually uses it.

The edge function stays deployed and untouched until the very end, so there is a working
fallback the whole way.

---

## Phase 1 — server routes in the app

TanStack Start serves non-page responses from server routes. Create them under
`src/routes/`, next to the page routes.

1. **`/sitemap.xml`** — port `handleGetSitemap` from
   `supabase/functions/api/index.ts`. It is the source of truth for what belongs in the
   sitemap; read it rather than inventing a new list. It emits:
   - seven static pages with their priorities and changefreq: `/`, `/discover`, `/blog`,
     `/terms`, `/privacy`, `/cookies`, `/impressum`. `/auth` is excluded on purpose, and
     the comment saying so should survive the move.
   - published blog posts, public prompts, published skills, published workflows and
     published prompt kits, each with `updated_at` as `lastmod`.

   Serve it as `application/xml; charset=utf-8`.

2. **`/rss.xml`** — port `handleGetRSS` the same way. Serve it as
   `application/rss+xml; charset=utf-8`.

Notes that will save you time:

- The queries can use the existing anon client (`src/integrations/supabase/client.ts`).
  Row-level security applies, which is correct: the sitemap must only list what a
  logged-out visitor can actually open. That is not theoretical here, see
  `migration/URGENT-public-pages-are-404.md`.
- The absolute origin belongs in `SITE_ORIGIN` from `src/lib/seo.ts`, not in a new
  literal and never from `window`.
- Keep the `Cache-Control: public, max-age=3600` the edge function sets.

3. **Point the advertised RSS URL at the new one.** `src/lib/seo.ts` currently emits
   `${SITE_ORIGIN}/api/rss.xml`. Change it to `${SITE_ORIGIN}/rss.xml`, which is the path
   you just built. Check no other file hard-codes `/api/rss.xml`.

## Phase 2 — robots.txt

In `public/robots.txt`, replace the Supabase URL on line 34 with:

    Sitemap: https://querino.ai/sitemap.xml

Leave everything else alone. Note that the served file is not only this file: Cloudflare
injects a managed block between `# BEGIN Cloudflare Managed content` and
`# END Cloudflare Managed Content` with its AI-bot rules. That block is not in the repo
and is not yours to edit.

## Phase 3 — verify locally, then deploy and verify live

Locally, the build and preview need a detour, because nitro writes to `.output/` while
`npx vite preview` looks in `dist/server/`:

```bash
NITRO_PRESET=node_server npm run build
PORT=4173 node .output/server/index.mjs &
```

Then:

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4173/sitemap.xml
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4173/rss.xml
curl -s http://localhost:4173/sitemap.xml | grep -c "<loc>"
```

Expect `200 application/xml`, `200 application/rss+xml`, and a `<loc>` count that matches
the live one. Compare against the edge function directly rather than against a number
written down here, because content changes:

```bash
curl -s https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/api/sitemap.xml | grep -c "<loc>"
```

The two must agree. If the app's count is lower, row-level security is hiding something
the edge function can see, and that is worth understanding before going further, not
worth working around.

Run the full gates before pushing:

```bash
npx tsc --noEmit          # expect 0
npm run check             # expect: ESLint 0 errors, 205 `any` (at the ceiling)
npm test                  # expect 138 passed
```

Then commit, push to `main`, and wait for the deploy. Verify live:

```bash
curl -s -D - -o /dev/null https://querino.ai/rss.xml | head -3
```

**`/rss.xml` must be 200 now.** Nothing intercepts that path, so it proves the server
route reached production. `/sitemap.xml` will still be answered by the Cloudflare rewrite
at this point, which is fine and expected: the content is identical either way.

**Do not go to Phase 4 until `/rss.xml` returns 200 live.** That request is the entire
evidence that TanStack server routes survive Lovable's deploy pipeline. If it does not,
stop and tell Michael, because the rest of the plan rests on it.

## Phase 4 — Michael removes the Cloudflare rewrite

Only after Phase 3 is green. Give him these steps and wait; do not attempt it yourself.

1. Sign in at `dash.cloudflare.com` and open the **querino.ai** zone.
2. The rewrite is one of these; check in this order and stop at the one that exists:
   - **Workers Routes**: Workers & Pages → the querino.ai zone's **Workers Routes**, or
     Rules → **Overview**. Look for a route matching `querino.ai/sitemap.xml`.
   - **Rules → Redirect Rules** or **Rules → Origin Rules**, again matching
     `/sitemap.xml`.
   - **Transform Rules → Rewrite URL**, same match.
3. Whatever it is, **disable it rather than delete it.** Every one of those screens has a
   toggle. A disabled rule can be switched back on in five seconds if this goes wrong; a
   deleted one has to be rebuilt from memory.
4. Tell the session it is off.

Then verify, and this is the moment that matters:

```bash
curl -s -D - -o /dev/null https://querino.ai/sitemap.xml | grep -iE "^HTTP|content-type|x-deployment-id"
curl -s https://querino.ai/sitemap.xml | grep -c "<loc>"
```

Expect `200`, `application/xml`, **and an `x-deployment-id` header**, which is the app
answering rather than the proxy. The `<loc>` count must match what it was before.

If anything is wrong: Michael re-enables the rule, and the site is back to today's
behaviour within seconds. Say that out loud before he touches anything.

## Phase 5 — only once Phase 4 has been stable for a day

Two pieces of cleanup, neither urgent, and both worth doing deliberately rather than in
the same sitting:

1. **Delete the rule in Cloudflare** rather than leaving it disabled, once nobody is
   nervous any more.
2. **Retire `/sitemap.xml` and `/rss.xml` from `supabase/functions/api`.** Check first
   whether anything else calls that function; `blog-api` is a separate function and is
   not affected. If the `api` function ends up serving nothing, say so and let Michael
   decide whether it is removed from `supabase/config.toml` too.

Do not do Phase 5 in the same session as Phase 4.

---

## Rules for this job

- **Measure, do not assume.** Every claim about what a URL returns gets a `curl` next to
  it. Do not write "should now work".
- **Do not touch Cloudflare.** The dashboard is Michael's. Your part is to make it
  unnecessary and to tell him exactly which toggle.
- **Do not touch** `supabase/migrations/**`, the database schema, or the MCP server. The
  `api` edge function is in scope only in Phase 5, and only to remove two handlers.
- **Do not change what the sitemap contains.** This job moves where it is served from.
  If you find something wrong with its contents, write it down and leave it.
- **Keep the gates green**: `npx tsc --noEmit` at 0, `npm run check` at 0 errors and 205
  `any`, `npm test` at 138 passed. If a number moved, say which and why.
- When you are done, report what each of the Phase 3 and Phase 4 commands returned. Not
  a summary of them: the output.
