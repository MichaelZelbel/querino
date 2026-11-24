// The pure state behind `useUnsavedChanges`: the clean baseline an editor
// compares its form against, and the time of the last real save.
//
// Two different events move the baseline. Loading a row sets it without
// anything having been written; a save, a new version, a publish or a restore
// writes the row and then sets it. Only the second may stamp a save time:
// every editor used to take its freshly loaded row as "saved", and the footer
// read "Saved · just now" the moment the page opened (#83).

export interface SaveState {
  /** Serialized form that matches the database, or null before the first. */
  baseline: string | null;
  /** When the user last saved in this editor; null until they do. */
  savedAt: Date | null;
}

export const initialSaveState: SaveState = { baseline: null, savedAt: null };

export function snapshot(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** A row was loaded into the form: it is the new baseline, nothing was saved. */
export function baselineLoaded(state: SaveState, loaded: unknown): SaveState {
  return { baseline: snapshot(loaded), savedAt: state.savedAt };
}

/** The form was written to the database: new baseline and a save time. */
export function recordSave(
  _state: SaveState,
  saved: unknown,
  now: Date,
): SaveState {
  return { baseline: snapshot(saved), savedAt: now };
}

/** Unsaved changes: a baseline exists and the form no longer matches it. */
export function isDirtyAgainst(state: SaveState, current: unknown): boolean {
  return state.baseline !== null && state.baseline !== snapshot(current);
}
