/**
 * localStorage that never throws. Safari in private mode, browsers with site
 * data blocked, and server-side rendering all make the bare accessor throw,
 * and a saved preference is never worth crashing a page over.
 */
function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return storage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      storage()?.setItem(key, value);
    } catch {
      // Quota exceeded or storage blocked: the value is a convenience, not state we depend on.
    }
  },
  removeItem(key: string): void {
    try {
      storage()?.removeItem(key);
    } catch {
      // Nothing to do: what cannot be read cannot need removing.
    }
  },
};
