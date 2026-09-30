// With its extension so the Deno unit tests (tests/web) can load this module;
// Vite and tsc accept both forms (allowImportingTsExtensions).
import { safeStorage } from "@/lib/safeStorage.ts";

const REDIRECT_KEY = "querino_redirect_path";
export const DEFAULT_REDIRECT = "/library";

/**
 * How long a stored redirect stays valid. It exists to carry the path across
 * an OAuth round trip or an email confirmation. Kept forever, a path stored
 * at a sign-up that was never confirmed took over some unrelated sign-in
 * days later.
 */
const REDIRECT_MAX_AGE_MS = 60 * 60 * 1000;

interface StoredRedirect {
  path: string;
  at: number;
}

const PROBE_ORIGIN = "https://querino.invalid";

/**
 * A path on this site, or DEFAULT_REDIRECT.
 *
 * The redirect comes from the query string, so anyone can write one into a
 * link. Only a path that starts with a single "/" stays on this origin:
 * "//evil.example" and "/\evil.example" (browsers read a backslash as a slash
 * here) are other hosts, and "https:..." or "javascript:..." are not paths at
 * all. Tabs and line breaks are refused too, because the URL parser deletes
 * them, which is how "/\t/evil.example" becomes "//evil.example". /auth itself
 * is refused so a sign-in never lands back on the sign-in page.
 *
 * Checked here, where every redirect is read and stored, so a caller that
 * forgets to check cannot turn this into an open redirect.
 */
export function safeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }
  // Backslashes and control characters have no place in an in-app path.
  for (const c of path) {
    const code = c.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || c === "\\") return DEFAULT_REDIRECT;
  }
  // What the browser will make of it, resolved against a placeholder origin:
  // anything that leaves that origin is not a path on this site.
  try {
    if (new URL(path, PROBE_ORIGIN).origin !== PROBE_ORIGIN) {
      return DEFAULT_REDIRECT;
    }
  } catch {
    return DEFAULT_REDIRECT;
  }
  if (path === "/auth" || /^\/auth[/?#]/.test(path)) return DEFAULT_REDIRECT;
  return path;
}

/**
 * Store the intended redirect path before OAuth redirect
 */
export function storeRedirectPath(path?: string | null): void {
  const value: StoredRedirect = {
    path: safeRedirectPath(path),
    at: Date.now(),
  };
  safeStorage.setItem(REDIRECT_KEY, JSON.stringify(value));
}

/** Forget any stored redirect path. */
export function clearRedirectPath(): void {
  safeStorage.removeItem(REDIRECT_KEY);
}

/**
 * Get and clear the stored redirect path. A path older than an hour, or one
 * stored in the old format without a time, is ignored.
 */
export function getAndClearRedirectPath(): string {
  const raw = safeStorage.getItem(REDIRECT_KEY);
  safeStorage.removeItem(REDIRECT_KEY);
  if (!raw) return DEFAULT_REDIRECT;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredRedirect> | null;
    if (
      parsed &&
      typeof parsed.path === "string" &&
      typeof parsed.at === "number" &&
      Date.now() - parsed.at <= REDIRECT_MAX_AGE_MS
    ) {
      return safeRedirectPath(parsed.path);
    }
  } catch {
    // Not JSON: a value from before the timestamp existed, age unknown.
  }
  return DEFAULT_REDIRECT;
}

/**
 * The redirect named in the URL, if it is a path on this site; otherwise
 * DEFAULT_REDIRECT.
 */
export function getRedirectFromParams(searchParams: URLSearchParams): string {
  return safeRedirectPath(searchParams.get("redirect"));
}
