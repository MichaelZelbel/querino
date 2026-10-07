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
  /** Remove every key that starts with one of `prefixes`. */
  removeByPrefix(prefixes: readonly string[]): void {
    try {
      const store = storage();
      if (!store) return;
      // Collected first: removing while walking by index skips keys.
      const doomed: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
          doomed.push(key);
        }
      }
      for (const key of doomed) store.removeItem(key);
    } catch {
      // Nothing to do: what cannot be read cannot need removing.
    }
  },
};
