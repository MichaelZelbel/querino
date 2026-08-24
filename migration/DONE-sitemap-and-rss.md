# Sitemap and RSS: phases 1 to 3, done and measured

The plan is `migration/NEXT-sitemap-and-rss.md`. This is what actually happened, with the
output of every command rather than a summary of it. Measured 2026-08-24.

Phase 4 (disabling the Cloudflare rewrite) is Michael's and is still open. Phase 5 waits a
day after that.

## What shipped

`src/lib/feeds.ts` builds both documents from the database. `src/routes/sitemap[.]xml.ts`
and `src/routes/rss[.]xml.ts` serve them as TanStack Start server routes. The brackets in
those filenames escape the dot, which the file router would otherwise read as a path
separator: `sitemap.xml.ts` would have served `/sitemap/xml`.

`public/robots.txt` now names `https://querino.ai/sitemap.xml` instead of the Supabase
host. `src/lib/seo.ts` advertises `/rss.xml` instead of `/api/rss.xml`, and so does the
legacy `SEOHead` component, which still hard-coded the old path even though only the
not-found page still mounts it.

The edge function is untouched and still deployed. The Cloudflare rewrite is untouched and
still answering `/sitemap.xml`.

## Local, against the production build

```
$ NITRO_PRESET=node_server npm run build
$ PORT=4173 node .output/server/index.mjs &

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4173/sitemap.xml
200 application/xml; charset=utf-8
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4173/rss.xml
200 application/rss+xml; charset=utf-8
$ curl -s http://localhost:4173/sitemap.xml | grep -c "<loc>"
102
$ curl -s https://zvuwkffneqxqsihlnfsd.supabase.co/functions/v1/api/sitemap.xml | grep -c "<loc>"
102
```

Byte for byte, not only equal in count: both documents are 18831 bytes and `diff` is
silent. The RSS differs from the edge function's in exactly two lines, the timestamp and
the `<atom:link>` self URL, which used to name `/api/rss.xml`, a URL that 404s.

## Gates

```
$ npx tsc --noEmit
(0)
$ npm run check
Migrations OK: 81 SECURITY DEFINER functions all set search_path, 54 tables all have row-level security, 2 views all state security_invoker.
ESLint: 0 errors, 205 `any` (at the ceiling).
deno check: 82 type errors across 35 edge functions, none of them new.
$ npm test
138 passed
```

`npm test` was 137 passed and 1 failed before a second commit fixed it, and the failure had
nothing to do with this job. `tests/security/09-menerio-links-resolve.spec.ts` reads the
route table out of the bundle querino.ai is serving and checks that every link the Menerio
worker announces is a route the site declares. React Router spelled a path parameter
`/prompts/:slug`; TanStack Router spells it `/prompts/$slug`. The migration changed the
spelling and the test kept looking for the old one, so it had been red on a site where
every one of those links resolves:

```
$ curl -s -o /dev/null -w "%{http_code}" https://querino.ai/prompts/conduct-a-project-premortem-and-plan-revision
200   <title>Conduct a Project Premortem and Plan Revision | Querino</title>
$ curl -s https://querino.ai/prompts/definitely-not-a-real-slug-xyz
      <title>Not Found | Querino</title>
```

Proven pre-existing by stashing the working tree and running that one spec on the clean
checkout: same failure, 3 passed 1 failed.

## Live

**The deploy is not automatic, and the plan assumed it was.** Pushing to `main` syncs the
code into Lovable and rebuilds the preview — `latest_commit_sha` went to `34c07bd9` within
a minute — but production kept serving the old `x-deployment-id` for the next twenty
minutes. Publishing to production is a separate, deliberate step: the Publish button in the
Lovable editor, or `deploy_project` over Lovable's MCP. Whoever runs the next job should
plan for it rather than waiting for something that will not happen.

After publishing:

```
$ curl -s -D - -o /dev/null https://querino.ai/rss.xml | head -3
HTTP/1.1 200 OK
Date: Mon, 24 Aug 2026 12:27:03 GMT
Content-Type: application/rss+xml; charset=utf-8
```

That is the whole point of Phase 3. Nothing intercepts `/rss.xml`, so a 200 there is proof
that TanStack server routes survive the deploy pipeline.

Who answers what right now:

```
$ curl -s -D - -o /dev/null https://querino.ai/rss.xml | grep -i "x-deployment-id"
x-deployment-id: 18c93a0127fb35f8ff243658043000e615dac5017e6840f46c9c27aa1e04ce6d

$ curl -s -D - -o /dev/null https://querino.ai/sitemap.xml | grep -i "x-deployment-id"
(nothing)
```

`/rss.xml` is the app. `/sitemap.xml` has no deployment header, so the Cloudflare rewrite is
still answering it, exactly as the plan expects at this point. Its content is identical
either way: 200, `application/xml; charset=utf-8`, 102 `<loc>` entries, 18831 bytes, `diff`
against the edge function silent.

`https://querino.ai/robots.txt` now ends with `Sitemap: https://querino.ai/sitemap.xml`, and
a blog page advertises
`<link rel="alternate" type="application/rss+xml" href="https://querino.ai/rss.xml"/>`.

## Two things found and deliberately left

**The feed has no items, because no blog post is published.** The edge function's feed was
empty too, so this is not a regression and not something this job may change: the sitemap's
102 URLs are 7 static pages, 89 prompts, 5 skills, 1 workflow, 0 blog posts and 0 prompt
kits. The feed will fill itself the day a post is published. Worth knowing before anyone
reads an empty `<channel>` as a bug in the port.

**`.output/` is committed to the repository**, 445 files of build output, swept in by
commit `231275c` ("Run the formatter, so the repo's own lint gate is green again") along
with the formatting. It is dead weight, not a deploy input: the live bundle is
`index-BKDaYhIO.js` and the committed one is `index-DXNmr2pW.js`, so nothing is serving it.
Every build now dirties 445 tracked files, and the next `git add -A` will commit whatever
they happen to contain. The fix is `git rm -r --cached .output` plus a `.gitignore` line,
which is a 445-file deletion and belongs in its own commit, not this one.

## What is still open

Phase 4 is Michael's: disable, not delete, the Cloudflare rule that rewrites
`/sitemap.xml`, then re-measure. Phase 5 is a day later: delete the disabled rule, and take
the two handlers out of `supabase/functions/api`.
