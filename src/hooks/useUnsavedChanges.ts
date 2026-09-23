import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";

interface Options<T> {
  data: T;
  isSaving: boolean;
  onSave: () => void | Promise<void>;
  /** When true (default), Cmd/Ctrl+S triggers onSave. */
  enableShortcut?: boolean;
  /** When true (default), prompts on tab close/reload while dirty. */
  enableBeforeUnload?: boolean;
  /** When true (default), confirms before in-app navigation while dirty. */
  enableNavigationGuard?: boolean;
}

interface Result<T> {
  isDirty: boolean;
  savedAt: Date | null;
  /**
   * Snapshot the clean baseline. Call after a successful save and once on
   * initial load. Pass the just-loaded values explicitly when calling right
   * after setState: the state of the current render is still the old one.
   */
  markSaved: (next?: T) => void;
  /**
   * Let the next navigation to this exact pathname through even while dirty.
   * For a save that renames the slug: the editor stays mounted on the new URL
   * with the edits still in it, so there is nothing to warn about.
   */
  allowNavigationTo: (pathname: string) => void;
}

function snapshot<T>(value: T): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function useUnsavedChanges<T>({
  data,
  isSaving,
  onSave,
  enableShortcut = true,
  enableBeforeUnload = true,
  enableNavigationGuard = true,
}: Options<T>): Result<T> {
  const baselineRef = useRef<string | null>(null);
  const [, force] = useState(0);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const current = snapshot(data);
  const isDirty =
    baselineRef.current !== null && baselineRef.current !== current;

  // Always the latest `data`, so markSaved does not have to be recreated per
  // render and does not close over a stale form. Every editor used to call
  // markSaved() inside the fetch effect right after setState, which snapshotted
  // the empty form of that render: the page counted as dirty the moment it
  // loaded, the leave-page confirm fired on every exit and Ctrl+S saved
  // unchanged data.
  const dataRef = useRef(data);
  dataRef.current = data;

  // Declared before markSaved so markSaved can settle it synchronously.
  const dirtyRef = useRef(false);

  const markSaved = useCallback((next?: T) => {
    baselineRef.current = snapshot(next === undefined ? dataRef.current : next);
    // Settle the navigation guard now, not after the next render's effect:
    // pages call navigate() straight after markSaved (a delete, a publish, a
    // slug rename), and the stale ref made the "unsaved changes" confirm fire
    // on a form that had just been saved.
    dirtyRef.current = baselineRef.current !== snapshot(dataRef.current);
    setSavedAt(new Date());
    force((n) => n + 1);
  }, []);

  // Keep onSave reference fresh for the keydown listener
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const savingRef = useRef(isSaving);
  useEffect(() => {
    savingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  // Cmd/Ctrl+S shortcut
  useEffect(() => {
    if (!enableShortcut) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (savingRef.current || !dirtyRef.current) return;
        void onSaveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enableShortcut]);

  // beforeunload guard
  useEffect(() => {
    if (!enableBeforeUnload || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enableBeforeUnload, isDirty]);

  // In-app navigation guard (beforeunload does not fire on router navigation).
  // TanStack Router's blocker replaces react-router's useBlocker (data-router API).
  const allowedPathRef = useRef<string | null>(null);
  const allowNavigationTo = useCallback((pathname: string) => {
    allowedPathRef.current = pathname;
  }, []);

  const blocker = useBlocker({
    shouldBlockFn: ({ current, next }) => {
      if (allowedPathRef.current !== null) {
        const allowed = allowedPathRef.current === next.pathname;
        allowedPathRef.current = null;
        if (allowed) return false;
      }
      return (
        enableNavigationGuard &&
        dirtyRef.current &&
        current.pathname !== next.pathname
      );
    },
    enableBeforeUnload: false,
    withResolver: true,
  });

  useEffect(() => {
    if (blocker.status !== "blocked") return;
    const leave = window.confirm(
      "You have unsaved changes. Leave without saving?",
    );
    if (leave) {
      blocker.proceed?.();
    } else {
      blocker.reset?.();
    }
  }, [blocker]);

  return { isDirty, savedAt, markSaved, allowNavigationTo };
}
