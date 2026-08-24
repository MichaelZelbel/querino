# The prompt to paste into Lovable

Copy everything below the line into Lovable. Not "migrate": a bare instruction throws
away every constraint here, and three of them are things no build error and no
screenshot would ever report.

---

Migrate this Vite + React 18 SPA to TanStack Start with Tailwind v4 and strict
TypeScript. Strict is already on and the codebase is at zero errors; keep it there.

Hard constraints:

- **Every URL path stays character-identical.** The list is
  `migration/routes.before.txt`, 52 paths. Dump the new route tree the same way and diff it. `/__tokens` is
  scaffolding and should be deleted, not migrated.
- **Auth behaviour stays identical**, and it is not what you would guess: there are no
  route guards, every guarded page renders sign-in *in place at its own URL*. Do not
  convert those into redirects. All ten behaviours are in
  `migration/routing-auth-contract.md`.
- **Do not touch** `supabase/functions/**`, `supabase/migrations/**`, the database
  schema, the MCP server, or the Cloudflare worker.
- **Port all 76 design tokens, do not re-derive them.** They are HSL triples consumed
  as `hsl(var(--token))`, and custom CSS uses `hsl(var(--token) / 0.08)`. Turning them
  into complete colours in `@theme` breaks every slash-opacity use silently. The five
  mechanics to get right are in `migration/visual-regression-checklist.md`.
- **Move page metadata into route metadata** using `migration/seo-inventory.md`. This
  is the reason for the migration: today `SEOHead` writes the head from a `useEffect`
  and renders `null`.
- **Mount the Tiptap editor client-only.** It initialises against the DOM.

When you are done, say which of the four checks in `migration/READINESS.md` §4 you ran
and what they returned.
