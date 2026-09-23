import { safeStorage } from "@/lib/safeStorage";

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

/**
 * Store the intended redirect path before OAuth redirect
 */
export function storeRedirectPath(path?: string | null): void {
  const value: StoredRedirect = {
    path: path || DEFAULT_REDIRECT,
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
      return parsed.path || DEFAULT_REDIRECT;
    }
  } catch {
    // Not JSON: a value from before the timestamp existed, age unknown.
  }
  return DEFAULT_REDIRECT;
}

/**
 * Get the redirect path from URL params or default
 */
export function getRedirectFromParams(searchParams: URLSearchParams): string {
  return searchParams.get("redirect") || DEFAULT_REDIRECT;
}
