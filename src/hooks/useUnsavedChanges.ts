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

interface Result {
  isDirty: boolean;
  savedAt: Date | null;
  /** Snapshot current `data` as the clean baseline. Call after a successful save and once on initial load. */
  markSaved: () => void;
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
}: Options<T>): Result {
  const baselineRef = useRef<string | null>(null);
  const [, force] = useState(0);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const current = snapshot(data);
  const isDirty = baselineRef.current !== null && baselineRef.current !== current;

  const markSaved = useCallback(() => {
    baselineRef.current = snapshot(data);
    setSavedAt(new Date());
    force((n) => n + 1);
  }, [data]);

  // Keep onSave reference fresh for the keydown listener
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const savingRef = useRef(isSaving);
  useEffect(() => {
    savingRef.current = isSaving;
  }, [isSaving]);

  const dirtyRef = useRef(isDirty);
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
  const blocker = useBlocker({
    shouldBlockFn: ({ current, next }) =>
      enableNavigationGuard &&
      dirtyRef.current &&
      current.pathname !== next.pathname,
    enableBeforeUnload: false,
    withResolver: true,
  });

  useEffect(() => {
    if (blocker.status !== "blocked") return;
    const leave = window.confirm(
      "You have unsaved changes. Leave without saving?"
    );
    if (leave) {
      blocker.proceed?.();
    } else {
      blocker.reset?.();
    }
  }, [blocker]);

  return { isDirty, savedAt, markSaved };
}
