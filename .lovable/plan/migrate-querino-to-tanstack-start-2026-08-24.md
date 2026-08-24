# Migrate Querino to TanStack Start

Goal: server-rendered head metadata and real HTTP status codes (the SEO reason for the move), with zero change to URLs, auth behaviour, visual design, or the backend.

## Scope

In scope: the frontend only — routing, entry points, Tailwind v3 → v4, head metadata, build config.

Untouched: `supabase/functions/**`, `supabase/migrations/**`, the database schema, the MCP server, the Cloudflare worker, and every hook/component that isn't affected by the router or styling change.

## What happens, in order

1. **Preflight.** Confirm the project builds clean today (it does: `npm run build` green, tsc at 0 errors). A broken baseline would make the post-migration build gate unreadable, so this runs first.

2. **Framework scaffolding.** TanStack Start entry points (`src/router.tsx`, `src/server.ts`, `src/start.ts`, `src/routes/__root.tsx`), Vite config wrapper, single strict `tsconfig.json`. `index.html`, `src/main.tsx`, `src/App.tsx`, `tailwind.config.ts`, `postcss.config.js` are removed once their contents have been carried over.

3. **Design tokens — ported verbatim, not re-derived.** All 76 custom properties move from `src/index.css` into `src/styles.css` **as HSL triples**, staying in `:root` / `.dark`, so `hsl(var(--token))` and `hsl(var(--token) / 0.08)` both keep working. The five known v4 traps are handled explicitly:
   - triples stay triples; `@theme` maps utilities onto `hsl(var(--x))`, it does not inline colours
   - `darkMode: ["class"]` → `@custom-variant dark (&:where(.dark, .dark *))`
   - container config (`center`, `2rem`, `2xl: 1400px`) → `@utility container`
   - `.text-gradient`, `.shadow-glow`, `.card-gradient` → `@utility`
   - display type scale keeps per-size line-height and letter-spacing as separate `--text-*` variables
   - `--grad-primary` vs `--gradient-primary` both carried; the known dark-mode `.card-gradient` bug is left as-is on purpose
   - hero CSS, `prefers-reduced-motion` block, `.ProseMirror` styles, all 7 keyframes/animations copied unchanged
   - the three Google Fonts links move into `__root.tsx` `head()` with the same print-media swap

4. **Routes — 52 files, paths character-identical.** One file per path under `src/routes/`, mirroring `migration/routes.before.txt` exactly, including `/dashboard` → `/library` as a `replace` redirect and the catch-all 404 rendering in place at its own URL. `/__tokens` and `src/pages/TokenGallery.tsx` are deleted, not migrated. Page components in `src/pages/**` are reused as-is.

5. **Auth stays in-page.** No `beforeLoad` guards, no server redirects. Every currently-guarded page keeps rendering its sign-in form or admin gate at its own URL. Providers (`AuthProvider`, `WorkspaceProvider`, `ThemeProvider`, `QueryClientProvider`, `TooltipProvider`, toasters, `CookieBanner`) sit in `__root.tsx` above `<Outlet />` so workspace selection and session survive navigation. The React Query `defaultOptions` (`gcTime`, `refetchOnWindowFocus: false`, `retry: 1`) are carried into the new QueryClient.

6. **Head metadata moves into route metadata.** Using `migration/seo-inventory.md`, each route's title / description / canonical / og / twitter / JSON-LD becomes a route `head()` (static routes) or loader-driven `head()` (parameterised routes), server-rendered instead of written from a `useEffect`. `SEOHead` is reduced to a thin shim where a page still needs runtime-only tags, so nothing regresses mid-migration. Canonicals become origin-independent. The `noindex` on the catch-all and on not-found branches is preserved, and those branches now also return a real 404 status.

7. **Client-only islands.** The Tiptap / ProseMirror editor and any other DOM-initialising widget mount client-side only, so SSR never evaluates them. Same treatment for the one remaining browser-global entry point flagged in `ssr-scan.json`, and for the preview auth storage broker, which keeps its `typeof window` guard.

8. **`useBlocker` → TanStack blocker.** `useUnsavedChanges` is rewritten against TanStack Router's blocker API, keeping the `beforeunload` half unchanged. Editor pages are re-checked by hand.

9. **Route-tree dump.** `migration/extract-routes.mjs` gets its `parseAppTsx()` replaced by a walk of `src/routes/**`, output format unchanged, as the file's own header instructs.

## The four READINESS §4 checks

Run at the end and reported verbatim:

1. `node migration/extract-routes.mjs && diff migration/routes.before.txt migration/routes.txt` — expect no output.
2. Build, re-shoot 106 screenshots, `node migration/compare-shots.mjs baseline-v2 after-migration` — expect ≤3 diffs, and only the three known live-data pages.
3. Re-capture the head inventory and `git diff migration/seo-inventory.json` — expect nothing missing. Titles/canonicals may gain values where SSR now emits them; nothing may lose one.
4. Walk all ten behaviours in `migration/routing-auth-contract.md` by hand in a browser, signed out and signed in, and report each one pass/fail.

Plus the standing gates: `npm run build` green and `tsc --noEmit` at zero errors.

## Notes and risks

- Screenshot comparison happens **before** `/__tokens` is deleted, so the token gallery pair is what proves the 76 tokens survived. Deletion is the last step.
- `npm test` (security suite) is unaffected — it exercises edge functions over HTTP.
- The migration lands as one chat turn and is revertible from chat history; the `pre-tanstack-baseline` tag remains the independent escape hatch.
- Starting the migration opens an upgrade-approval card; from there it runs straight through without further check-ins.
