# The four checks, run 2026-08-24

Run locally against the migrated `main` (`b093d76` "Migrated Querino to TanStack" and the
commits after it), built with `NITRO_PRESET=node_server npm run build` and served from
`.output/server/index.mjs` on port 4173. That detour is needed because the nitro build
writes to `.output/` while `npx vite preview` looks in `dist/server/`, so preview is
broken in this configuration.

Two of the four pass. One passes but not the way it was reported. One fails, and it is
the one the migration existed for.

---

## Check 1 — routes: PASS, 52/52 character-identical

`diff --strip-trailing-cr migration/routes.before.txt migration/routes.after.txt` is
empty. `routes.after.txt` is extracted from `src/routeTree.gen.ts`, normalising
TanStack's `$param` back to React Router's `:param` so the diff is about paths and not
about spelling. `/__tokens` was deleted rather than migrated, as instructed.

**But it was not checked the way the migration report said it was.** The report claims it
"regenerated migration/routes.txt from the new route tree and diffed against
routes.before.txt. Diff empty." `migration/extract-routes.mjs` parses `src/App.tsx`, and
`src/App.tsx` no longer exists, so the script exits with a module error. `routes.txt` on
disk was still the untouched frozen copy, which is why diffing it against
`routes.before.txt` came back empty: it was being compared with itself. The result is
right; the method could not have produced it.

---

## Check 2 — pixels: 94 of 106 screenshots differ, and two regressions are real

Most of it is noise. Banded by how far the file size moved:

| band | screenshots |
|---|---|
| byte-identical | 12 |
| under 1% | 84 |
| 1–5% | 2 |
| 5–20% | 6 |
| over 20% | 2 |

The two over 20% are `__tokens`, which is correct: the gallery route was deleted, so
those two now photograph a 404 page. The 84 under 1% are antialiasing.

The rendered page height is the sharper instrument, and it found two things.

### Regression A: every link on the site is now underlined

Measured on the running build, not read off a screenshot:

```
support@querino.ai            text-decoration-line: underline
https://ec.europa.eu/...      underline
Privacy Policy                underline
Terms of Service              underline
Cookie Policy                 underline
```

In `baseline-v2/impressum@desktop.png` the same links carry colour and no underline.
This is site-wide and affects every page with a link in body text.

**Cause, established in round two below:** not preflight. v4 does still set
`a { text-decoration: inherit }`, and it is in the built CSS. It is
`@tailwindcss/typography`, which the migration switched on for the first time.

### Regression B: the long text pages grew 5 to 15 percent taller

| page | desktop | mobile |
|---|---|---|
| `/docs` | 16420 → 18926 px (+2506) | 24340 → 28191 px (+3851) |
| `/privacy` | 9416 → 11187 px (+1771) | 16124 → 18815 px (+2691) |
| `/terms` | 6394 → 7436 px (+1042) | 11370 → 13112 px (+1742) |
| `/impressum` | 2492 → 3011 px (+519) | 3672 → 4307 px (+635) |
| `/cookies` | 2968 → 3291 px (+323) | 5016 → 5611 px (+595) |
| `/community-guidelines` | 2224 → 2388 px (+164) | 3688 → 3968 px (+280) |

All in the same direction. Comparing the two impressum screenshots shows why: address
blocks that used to sit as tight four-line groups now have a full line of air between
each line.

**Cause, established in round two below:** the same one line. Not a `space-y` selector,
which is what the paragraph margins of `0px` first suggested, but prose imposing its own
vertical rhythm on eleven components that had been carrying inert `prose` classes.

`/cookies` on mobile also went from 445 px wide to 458 px against a 390 px viewport, so
it overflowed horizontally before and overflows further now.

### Not a regression

A uniform −22 px on every page that redirects to `/auth`, which is one shared element on
the sign-in card, and −12 px on the landing page. Below anything a reader notices.

---

## Check 3 — head and SEO: FAIL. Nothing page-specific is server-rendered

This is the check that matters, because server-rendered metadata is the reason the
migration was worth doing.

Fetching the raw HTML of all 53 URLs, before any JavaScript runs:

| measured | result |
|---|---|
| routes checked | 53 |
| distinct `<title>` values in the server HTML | **1** |
| routes serving the generic site title | **53 of 53** |
| routes with a `<link rel="canonical">` | **0** |
| distinct `<meta name="description">` values | **1** |
| routes with page-specific structured data | **0** (every page has the same two site-wide blocks) |

After JavaScript runs, the head is correct: 53 titles, 10 canonicals, `CreativeWork`
structured data on the artefact pages. So nothing regressed for a human. Nothing
improved for a crawler either, which was the point.

The cause is visible in the route files:

- **0 of 52 routes define a `loader`.** No route fetches its data on the server, so the
  artefact is not in the HTML: `/prompts/folder-to-memory` does not contain the string
  "Folder To Memory" anywhere in the server response.
- **1 of 52 routes defines a `head`**, and it is `__root.tsx`. Every page inherits the
  same one.
- `src/components/seo/SEOHead.tsx` still exists and is still imported by 13 files. It
  still writes the head from a `useEffect` and still renders `null`.

The migration report says "static heads moved into route `head()` in `__root.tsx` and
route files". Only `__root.tsx` has one.

The framework changed and SSR is genuinely running: the HTML is generated on the server.
What has not happened is any route being given the data or the metadata to render there.

---

## Check 4 — the routing and auth contract: PASS, and the contract document was wrong

Automated five of the ten behaviours against the running build. Three came back as
failures and all three were mine, not the migration's.

| behaviour | result |
|---|---|
| `/settings` logged out | lands on `/auth?redirect=/settings` |
| `/admin` logged out | lands on `/` |
| `/dashboard` | 301 to `/library`, which then redirects to `/auth?redirect=/library` |
| unknown URL | 404 at that URL with `noindex, nofollow` — matches |
| `/prompts/<uuid>` | resolves to `/prompts/folder-to-memory` — matches |

`migration/routing-auth-contract.md` claimed a guarded page "renders sign-in in place; it
does not redirect". It never did. `Auth.tsx` builds the banner "Sign in to access **your
settings**" out of the `?redirect=` parameter, so the baseline screenshot that produced
that claim was a photograph of `/auth`, taken without recording the final URL, and read
as if it were `/settings`.

Proof the migration preserved it: `git diff pre-tanstack-baseline HEAD` on
`src/pages/Settings.tsx`, `Admin.tsx` and `Library.tsx` shows one changed line each, and
it is the import swapping `react-router-dom` for `@/lib/router-compat`. The navigation
logic is untouched. `/dashboard` is the only route with a `beforeLoad`, and it does
exactly what the contract asks: `redirect({ to: "/library", replace: true })`.

The contract file has been corrected.

The remaining five behaviours need a signed-in session and were not automated: the
unsaved-changes blocker, workspace persistence across navigation, session survival on
reload, the OAuth round trip through `querino_redirect_path`, and team-mate profile
visibility.

---

## What to do next, in order

1. **Give the routes their metadata.** Nothing else in this list changes what a crawler
   sees. `migration/seo-inventory.md` has the target for all 53 routes.
2. **Give the artefact routes a `loader`.** Without one the page content is not in the
   HTML either, so even correct metadata would describe a page whose body arrives later.
3. **Restore the link styling.** One rule, site-wide.
4. **Find the `space-y` that changed** and put the legal and docs pages back.
5. **Walk the five session behaviours by hand.**

Re-run everything with:

```bash
NITRO_PRESET=node_server npm run build
PORT=4173 node .output/server/index.mjs &
SHOT_BASE_URL=http://localhost:4173 SHOT_DIR=after-migration \
  npx playwright test --config=playwright.baseline.config.ts
node migration/compare-shots.mjs baseline-v2 after-migration
```

---

# Round two, 2026-08-24: the five follow-ups

Everything in the list at the end of the first round, done and measured.

## 1 and 2 — routes now carry their own metadata, and their own data

`src/lib/seo.ts` builds a `head()` payload with the same rules SEOHead used, so the text a
person sees after hydration and the text a crawler reads in the HTML are identical.
`src/lib/route-loaders.ts` fetches the record on the server for the eight public detail
routes. 42 static routes got a head from a generator; the 8 dynamic ones were written by
hand.

Measured from the raw HTML of 52 routes, before any JavaScript runs:

| | before | after |
|---|---|---|
| distinct `<title>` values | 1 | **48** |
| routes serving only the generic title | 53 | **2**, the home page and the 404 |
| routes with a `<link rel="canonical">` | 0 | **12** |
| distinct descriptions | 1 | **14** |
| routes with page-specific structured data | 0 | **3**, the artefact routes that have data |
| private routes marked `noindex` | 0 | **39** |

Every canonical points at `https://querino.ai`, never at the host that served the page,
because the helper uses a configured origin rather than asking the window.

The artefact body is in the HTML too, not only its title: `curl /prompts/folder-to-memory`
now contains the string "Folder To Memory". The four artefact pages take the loader's
record as their initial state and keep their own fetch for slug changes, so the empty
first paint is gone without changing how the page behaves after that.

A missing slug is no longer a soft 404: `/prompts/definitely-not-a-real-slug` serves
`Not Found | Querino` with `noindex, nofollow` from the server, and an unknown URL
returns a real HTTP 404.

`SEOHead` was removed from the 12 pages whose routes now carry the head, because it would
otherwise overwrite the server-rendered canonical with a window-derived one on hydration.
It stays in `NotFound.tsx`: the catch-all has no route file to hang a `head()` on.

## 3 and 4 — both visual regressions were one line

`@tailwindcss/typography` has been a dependency for a long time, but `tailwind.config.ts`
never listed it in `plugins`, so every `prose` class in the app was inert. Eleven
components carry them. `src/styles.css` added `@plugin "@tailwindcss/typography"` during
the migration and all of that styling applied at once: prose underlines links and imposes
its own vertical rhythm.

Commenting the line out:

| | broken | fixed | reference |
|---|---|---|---|
| anchors on `/impressum` | underline | none | none |
| `/docs` desktop height | 18926px | **16420px** | 16420px |
| `/privacy` desktop | 11187px | 9432px | 9416px |
| total height drift over 106 screenshots | 22511px | **6536px** | — |

5108px of the remaining 6536 is the deleted `/__tokens` route now being a 404 page. The
rest is under 16px per file.

If the prose styling is actually wanted, it is one uncommented line and a re-taken
reference set. That is a design decision, so it was not made here.

## 5 — the five session behaviours

`migration/session-contract-check.mjs` automates them so they can be re-run rather than
remembered. **5 of 5 hold.**

- the session survives a reload
- the workspace selection outlives navigation
- the unsaved-changes blocker stops an in-app navigation
- the OAuth redirect key is reachable on the auth page
- a signed-in visitor sees the author byline

Two came back red at first and both were the probe, not the app. `/prompts/new` has no
unsaved-changes guard at all: only `EditProfile`, `LibraryPromptEdit` and `PromptKitEdit`
use the hook. And `WorkspaceProvider` only writes its key when someone actively switches
workspace, so an untouched session having no key is correct. Its "reset to personal when
the user logs out" effect is byte-identical to the pre-migration one, so a hard reload
clearing the key is a pre-existing quirk, not something the migration did.

Not automated, and honestly so: the OAuth round trip leaves the origin, and switching to
a real team needs an account that has one.

## Found on the way: the repo's own lint gate is broken

`npm run check` was green before the migration. It is not now. The migration added
`prettier` as an ESLint rule and a `format` script, but never ran the formatter across
the codebase.

A `.prettierrc` with `endOfLine: "auto"` was added here, which takes it from 58,364
errors to 10,094. The difference is entirely CRLF: without that file any Windows checkout
fails the gate on line endings alone. The remaining 10,094 are real formatting
differences in files the migration did not touch.

`npm run format` fixes them in one command. It was **not** run, because it rewrites
essentially every file in the repository and would bury the migration in a formatting
diff. That is a call worth making deliberately.

The `any` count is unchanged at 205, exactly the ratchet ceiling.

## State after round two

- typecheck: 0 errors
- build: green
- security suite: 138 passed, 0 failed
- routes: 52/52 character-identical
- screenshots: no new drift beyond the two fixes above
- session contract: 5/5
