import { useEffect, useRef } from "react";

/**
 * Hands a prefilled draft (an imported Markdown file, a translation) to a
 * "new artifact" page through sessionStorage instead of the query string.
 *
 * Until 2026-09-16 the whole artifact body travelled as ?content=, so a reload
 * of a long import sent a request line past the server's limit. The URL now
 * carries only ?handoff=<key>; the receiving page reads the entry once and
 * removes it. A plain ?content= link keeps working, the pages still read it.
 */

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

/** Read and remove a stashed draft. Browser only; returns null on the server. */
export function takeDraft(key: string | null): Record<string, string> | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_PREFIX + key);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Apply a stashed draft once the page is in the browser. Runs in an effect
 * because the page is server-rendered, where sessionStorage does not exist.
 */
export function useDraftHandoff(
  searchParams: URLSearchParams,
  apply: (draft: Record<string, string>) => void,
) {
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });
  const key = searchParams.get(HANDOFF_PARAM);

  useEffect(() => {
    const draft = takeDraft(key);
    if (draft) applyRef.current(draft);
  }, [key]);
}
