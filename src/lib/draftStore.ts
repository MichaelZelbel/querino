// The storage half of lib/draftHandoff.ts (see the comment there), kept free of
// React so the unit tests in tests/web can load it.

export const HANDOFF_PARAM = "handoff";
const STORAGE_PREFIX = "querino:handoff:";

export type DraftFields = Record<string, string | undefined | null>;

function newKey(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Build the URL of a "new" page carrying `draft`. `urlParams` always stay in
 * the query string (short routing values such as menerio_note_id). If
 * sessionStorage is unavailable the draft falls back to query params.
 */
export function draftUrl(
  path: string,
  draft: DraftFields,
  urlParams: DraftFields = {},
): string {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(draft)) if (v) clean[k] = v;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(urlParams)) if (v) params.set(k, v);

  let stored = false;
  if (Object.keys(clean).length > 0) {
    try {
      const key = newKey();
      window.sessionStorage.setItem(
        STORAGE_PREFIX + key,
        JSON.stringify(clean),
      );
      params.set(HANDOFF_PARAM, key);
      stored = true;
    } catch {
      // Private mode or quota: use the old query-string handoff.
    }
  }
  if (!stored) for (const [k, v] of Object.entries(clean)) params.set(k, v);

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Read a stashed draft. Browser only; returns null on the server. */
export function readDraft(key: string | null): Record<string, string> | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
