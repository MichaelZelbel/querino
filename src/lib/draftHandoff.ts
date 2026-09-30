import { useEffect, useRef } from "react";
import { HANDOFF_PARAM, readDraft } from "./draftStore.ts";

export { HANDOFF_PARAM, draftUrl, readDraft } from "./draftStore.ts";
export type { DraftFields } from "./draftStore.ts";

/**
 * Hands a prefilled draft (an imported Markdown file, a translation) to a
 * "new artifact" page through sessionStorage instead of the query string.
 *
 * Until 2026-09-16 the whole artifact body travelled as ?content=, so a reload
 * of a long import sent a request line past the server's limit. The URL now
 * carries only ?handoff=<key>, and the receiving page reads the entry. A plain
 * ?content= link keeps working, the pages still read it.
 *
 * The entry is read, not taken. Until 2026-09-30 the first read removed it, so
 * reloading the page (or React running the effect twice in development) came
 * back to an empty form and the imported or translated text was gone. It lives
 * in sessionStorage under a random key, so it still dies with the tab.
 */

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
    const draft = readDraft(key);
    if (draft) applyRef.current(draft);
  }, [key]);
}
