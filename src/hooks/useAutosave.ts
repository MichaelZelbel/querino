import { useState, useEffect, useRef, useCallback } from "react";

export type AutosaveStatus = "saved" | "saving" | "unsaved" | "error";

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutosaveReturn<T> {
  status: AutosaveStatus;
  lastSaved: T | null;
  hasChanges: boolean;
  resetLastSaved: (data: T) => void;
  forceSave: () => Promise<void>;
  /** Drop a save that is waiting on its timer, without saving it. */
  cancelPending: () => void;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (
      !deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }

  return true;
}

export function useAutosave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const [status, setStatus] = useState<AutosaveStatus>("saved");
  const [lastSaved, setLastSaved] = useState<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingDataRef = useRef<T | null>(null);

  const hasChanges = lastSaved !== null && !deepEqual(data, lastSaved);

  // Callers pass a fresh onSave every render. Reading it through a ref keeps
  // performSave stable, so the timer effect below re-runs only when the data
  // changes and a cancelled timer stays cancelled through unrelated renders.
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const performSave = useCallback(async (dataToSave: T) => {
    if (isSavingRef.current) {
      pendingDataRef.current = dataToSave;
      return;
    }

    isSavingRef.current = true;
    setStatus("saving");

    try {
      await onSaveRef.current(dataToSave);
      setLastSaved(dataToSave);
      setStatus("saved");

      // Check if there's pending data that changed while we were saving
      if (
        pendingDataRef.current &&
        !deepEqual(pendingDataRef.current, dataToSave)
      ) {
        const pendingData = pendingDataRef.current;
        pendingDataRef.current = null;
        isSavingRef.current = false;
        await performSave(pendingData);
        return;
      }
    } catch (error) {
      console.error("Autosave error:", error);
      setStatus("error");
    } finally {
      isSavingRef.current = false;
      pendingDataRef.current = null;
    }
  }, []);

  const cancelPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const forceSave = useCallback(async () => {
    cancelPending();
    await performSave(data);
  }, [data, performSave, cancelPending]);

  const resetLastSaved = useCallback((newData: T) => {
    setLastSaved(newData);
    setStatus("saved");
  }, []);

  // Autosave effect
  useEffect(() => {
    if (!enabled || lastSaved === null) return;

    if (deepEqual(data, lastSaved)) {
      return;
    }

    setStatus("unsaved");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, lastSaved, delay, enabled, performSave]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSaved,
    hasChanges,
    resetLastSaved,
    forceSave,
    cancelPending,
  };
}
