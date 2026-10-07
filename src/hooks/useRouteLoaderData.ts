import { useCallback, useEffect } from "react";
import { isNotFound, useMatch, useRouter } from "@tanstack/react-router";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * The detail routes' route loader is the one source of their row (2026-10-07).
 * These hooks and the loader wrapper are what the pages and the routes need
 * around it.
 */

// The (route, address, account) triples a loader run with that account's
// session has already answered "not found" for, in this page's life. Module
// level, not a ref: re-running the loader suspends the route, so the
// not-found view unmounts and comes back as a fresh component, and a ref
// would ask forever for a row that really is not there. Only the browser
// writes to it, so it stays empty on the server.
const askedWithSession = new Set<string>();

const askedKey = (routeId: string, slug: string, userId: string) =>
  `${routeId}|${slug}|${userId}`;

/**
 * A detail route's loader, noting when a run in the browser with a session
 * found nothing. A client-side visit runs the loader in the browser, where the
 * session already is, so its "not found" is final for that account; the
 * signed-in retry below then had nothing to add but ran it a second time anyway
 * (2026-10-07). The server is always signed out, so its answer is never noted.
 */
export async function loadRememberingMiss<T>(
  routeId: string,
  slug: string,
  load: () => Promise<T>,
): Promise<T> {
  if (typeof window === "undefined") return load();
  // The same session the loader's own queries are about to send.
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  try {
    return await load();
  } catch (err) {
    if (userId && isNotFound(err)) {
      askedWithSession.add(askedKey(routeId, slug, userId));
    }
    throw err;
  }
}

/**
 * True while a detail route's "not found" may still be a private row that the
 * browser is asking for again with the visitor's session.
 *
 * The first page of a visit is rendered on the server, signed out, so a private
 * or team artifact opened directly came back as not found, and the tab kept the
 * title "Not Found | Querino" even after the page fetched the row itself
 * (known open since 2026-09-23). Once the browser knows who is signed in, this
 * runs the route's loader again, once, with that session; the row then arrives
 * through the loader and head() builds the real title from it. While that run
 * is pending the caller shows its loading skeleton.
 *
 * Without a signed-in user this is false, and the caller shows the not-found
 * view. That is the server's answer, so the HTML a crawler or a visitor
 * without JavaScript receives says "not found" along with its 404 status: it
 * used to answer with auth's `loading`, which is true on the server, so every
 * missing detail page was served as a loading skeleton. It is also what the
 * browser's first render sees, since auth starts out unknown there too, so
 * hydration matches the server's markup and the skeleton only appears after
 * mount, once a session turns up.
 *
 * A loader run that already had the session (a client-side visit, see
 * loadRememberingMiss) is not repeated. Signing in later needs nothing here:
 * useAuth invalidates every route when the account changes.
 */
export function useSignedInRetry(routeId: string, slug: string): boolean {
  const router = useRouter();
  const { user } = useAuthContext();
  const key = user ? askedKey(routeId, slug, user.id) : null;

  useEffect(() => {
    if (!key || askedWithSession.has(key)) return;
    askedWithSession.add(key);
    void router.invalidate({ filter: (match) => match.routeId === routeId });
  }, [key, router, routeId]);

  if (!key) return false;
  return !askedWithSession.has(key);
}

/**
 * Re-run the loader of the route this component renders in, and resolve once
 * the new row is on screen. A page calls it after a change it made to its own
 * row (an applied suggestion, a restored version, an AI edit, a Menerio sync)
 * instead of selecting the row again itself. Only this route's match is
 * invalidated, so the rest of the page keeps its state and nothing remounts.
 */
export function useReloadRouteData(): () => Promise<void> {
  const router = useRouter();
  const matchId = useMatch({ strict: false, select: (match) => match.id });
  return useCallback(
    () => router.invalidate({ filter: (match) => match.id === matchId }),
    [router, matchId],
  );
}
