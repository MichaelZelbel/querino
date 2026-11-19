// A window scroll position the router saved for a history entry.
export interface SavedScroll {
  scrollX: number;
  scrollY: number;
}

interface ScrollableWindow {
  scrollX: number;
  scrollY: number;
  scrollTo(x: number, y: number): void;
}

/**
 * Puts the window where the router saved it for this history entry, or leaves it
 * alone when nothing was saved. A list opened fresh is a new history entry with
 * nothing saved, so the router's own move to the top still decides it.
 *
 * Why this exists (#75): the router restores the position from a layout effect
 * that runs on the commit after the one that renders the page, so Back to a list
 * painted it at the top (scrollY 0) before it jumped. Called from a layout effect
 * of the list itself, this runs before that first paint.
 */
export function restoreSavedScroll(
  saved: SavedScroll | undefined,
  win: ScrollableWindow,
): boolean {
  if (!saved) return false;
  if (win.scrollX === saved.scrollX && win.scrollY === saved.scrollY) {
    return false;
  }
  win.scrollTo(saved.scrollX, saved.scrollY);
  return true;
}
