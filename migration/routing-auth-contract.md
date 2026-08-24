# What the migration must not change about routing and auth

A migration that builds cleanly and still breaks sign-in has failed. None of the
behaviours below produce a build error when they break, and none of them are covered by
the screenshot baseline, so this file is the list to walk by hand.

Written from `migration/routes.json` and from the baseline screenshots, both taken from
the running production build on 2026-08-24.

## The shape of the router today

52 routes, all of them in one `<Routes>` block in `src/App.tsx`, which itself sits under
a single catch-all route of a `createBrowserRouter` data router. The data router exists
only so `useBlocker` works for the unsaved-changes guard; the route definitions
themselves are the old `<Routes>` form.

**There are no route guards.** Not one route wraps its element in a guard component. Of
52 routes, 22 are public, 20 check authentication inside the page, 8 check for admin
inside the page, 1 is a redirect and 1 is the catch-all. The migration will be tempted to
turn 28 in-page checks into route-level `beforeLoad` guards, which is the right shape for
TanStack, and it is exactly where the behaviours below get lost.

## The contract, one line each, each of them checkable by hand

1. **A guarded route redirects to `/auth` and carries the destination in the query
   string.** Visit `/settings` logged out and you land on `/auth?redirect=/settings`,
   where `Auth.tsx` turns the parameter into the banner "Sign in to access your
   settings." Each guarded page does this itself, in its own `useEffect`, with
   `replace: true`, so the guarded URL does not stay in history.

   **Correction, 2026-08-24:** this file first claimed the opposite, that the sign-in
   form renders in place at the guarded URL. That was wrong. It was inferred from
   `migration/baseline/settings@desktop.png` without recording the final URL, and the
   banner text, which names the page you were heading for, made the screenshot look like
   it had been taken at `/settings`. It was taken at `/auth`. The post-migration check
   is what caught it: three "failures" turned out to be the behaviour working exactly as
   it always had.

   What must still hold: the destination survives the round trip. `?redirect=` for an
   in-page sign-in, and `querino_redirect_path` in localStorage for an OAuth round trip
   where the query string does not survive. Both fall back to `/library`.

2. **`/admin` sends a non-admin to `/`, not to `/auth`.** `Admin.tsx` calls
   `navigate("/")` when the visitor is not signed in and again when they are signed in
   without the admin role. Different from every other guarded page, and deliberate: it
   does not tell an anonymous visitor that an admin area exists.

3. **`/dashboard` is a permanent redirect to `/library`.** It is the only `<Navigate>` in
   the router, `replace` is set, so it must not appear in history. It is a legacy URL
   people still have bookmarked.

4. **The catch-all renders a 404 page at whatever URL was asked for.** It sets
   `robots: noindex, nofollow`. It must not redirect to `/`.

5. **`/prompts/<uuid>` redirects to the slug.** `PromptDetail` detects a UUID in the slug
   position, resolves the canonical slug through `resolveSlugFromId` (`src/lib/uuidRoute.ts`), and navigates with
   `replace`. Pre-slug URLs are still in the wild. The same pattern exists for skills,
   workflows and prompt kits, and each has a `*_slug_redirects` table behind it.

6. **Deep links into parameterised routes work without a prior visit.** All 20
   parameterised routes read their parameter with `useParams` and fetch on mount. There
   is no dependency on state left behind by a previous page.

7. **Sign-in returns you where you were, by two different routes.** For an in-page
   sign-in the intended path travels as `?redirect=<pathname>` and `Auth.tsx` reads it
   with `getRedirectFromParams`. For an OAuth round trip the query string does not
   survive, so `storeRedirectPath` parks it in localStorage under
   `querino_redirect_path` and `getAndClearRedirectPath` collects it on return. Both
   paths fall back to `/library`. The localStorage half is the fragile one: it is a
   browser API in the middle of an auth flow that a server will now take part in.
   The pathname the comments link sends now comes from the router (`useLocation`)
   rather than from `window`.

8. **The session survives a reload.** `AuthProvider` restores it from Supabase's storage.
   On a Lovable preview surface, `src/integrations/supabase/previewAuthStorage.ts`
   brokers the session to the editor over `postMessage` instead of using localStorage
   directly, so the preview and the editor share one login. That file already guards for
   the absence of `window`; whatever the migration does to it must keep that.

9. **The unsaved-changes guard blocks in-app navigation.** `useUnsavedChanges` combines a
   `beforeunload` listener with `useBlocker`. `useBlocker` is a data-router API, which is
   why the whole tree sits under `createBrowserRouter` in the first place. TanStack Router
   has its own blocker; it is a rewrite, not a port, and the editor pages depend on it.

10. **Workspace context outlives navigation.** `WorkspaceProvider` wraps the whole route
    tree and holds the personal-versus-team selection in localStorage. If the migration
    moves providers below the route boundary, switching pages resets the workspace.

## How to check all ten after the migration

Sign out completely, then:

    /settings          lands on /auth?redirect=/settings, banner names "your settings"
    /admin             lands on /, silently
    /dashboard         lands on /library, and Back does not return here
    /nonsense-url      404 page, URL unchanged, noindex present
    /prompts/<a uuid>  becomes /prompts/<slug>, and Back does not return to the uuid

Then sign in and:

    open an editor, change a field, click another link   the block prompt appears
    switch to a team workspace, navigate twice           the team is still selected
    reload on any page                                   still signed in
