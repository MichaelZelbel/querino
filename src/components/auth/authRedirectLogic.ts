// Where the sign-in page may send someone afterwards. Kept out of Auth.tsx so
// it can be tested without React or the Supabase client.

// With its extension so the Deno unit tests (tests/web) can load it.
import { DEFAULT_REDIRECT, safeRedirectPath } from "@/lib/authRedirect.ts";

export { DEFAULT_REDIRECT };

/**
 * Only an in-app path may be a redirect target. The one checker lives in
 * src/lib/authRedirect.ts (safeRedirectPath), where every redirect is read and
 * stored; this name is what the sign-in page and the header call.
 */
export const safeRedirect = safeRedirectPath;

/**
 * The header's "Sign In" / "Get Started" link. It carries the page the person
 * is on, so signing in from a prompt page comes back to that prompt instead of
 * landing in the library. The home page and the sign-in page itself carry
 * nothing: the library is the right place after either.
 */
export function authHref(
  tab: "signin" | "signup",
  pathname: string,
  search = "",
): string {
  const params = new URLSearchParams();
  if (tab === "signup") params.set("tab", "signup");
  const here = pathname + search;
  if (
    pathname !== "/" &&
    pathname !== "/auth" &&
    !pathname.startsWith("/auth/") &&
    safeRedirect(here) === here
  ) {
    params.set("redirect", here);
  }
  const qs = params.toString();
  return qs ? `/auth?${qs}` : "/auth";
}
