import { useLayoutEffect } from "react";
import { useElementScrollRestoration } from "@tanstack/react-router";
import { restoreSavedScroll } from "@/lib/restoreScroll";

const getWindow = () => (typeof window === "undefined" ? undefined : window);

/**
 * For a page reached by Back or Forward: put the window at the position the
 * router saved for it before the page is first painted, instead of a commit
 * later (see restoreSavedScroll). Call it at the top of a list page.
 */
export function useRestoreScrollBeforePaint(): void {
  // Read while the page mounts: the entry of the history entry being shown.
  const saved = useElementScrollRestoration({ getElement: getWindow });
  useLayoutEffect(() => {
    restoreSavedScroll(saved, window);
    // Only on mount: later changes of the address (Discover's filters) are not
    // a return to a saved position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
