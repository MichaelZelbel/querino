import { safeStorage } from "@/lib/safeStorage";

const REDIRECT_KEY = "querino_redirect_path";
const DEFAULT_REDIRECT = "/library";

/**
 * Store the intended redirect path before OAuth redirect
 */
export function storeRedirectPath(path?: string | null): void {
  const redirectPath = path || DEFAULT_REDIRECT;
  safeStorage.setItem(REDIRECT_KEY, redirectPath);
}

/**
 * Get and clear the stored redirect path
 */
export function getAndClearRedirectPath(): string {
  const path = safeStorage.getItem(REDIRECT_KEY);
  safeStorage.removeItem(REDIRECT_KEY);
  return path || DEFAULT_REDIRECT;
}

/**
 * Get the redirect path from URL params or default
 */
export function getRedirectFromParams(searchParams: URLSearchParams): string {
  return searchParams.get("redirect") || DEFAULT_REDIRECT;
}
