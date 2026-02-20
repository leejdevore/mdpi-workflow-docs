'use client';

import { useCallback, useRef, useState } from 'react';

interface UndoRedoState<T> {
  state: T;
  setState: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initial: T) => void;
  /** Take a snapshot of current state before a mutation */
  snapshot: () => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory = 50): UndoRedoState<T> {
  const [present, setPresent] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const snapshot = useCallback(() => {
    pastRef.current = [...pastRef.current, present].slice(-maxHistory);
    futureRef.current = [];
  }, [present, maxHistory]);

  const setState = useCallback(
    (next: T) => {
      setPresent(next);
    },
    []
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [present, ...futureRef.current];
    setPresent(previous);
  }, [present]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, present];
    setPresent(next);
  }, [present]);

  const reset = useCallback((initial: T) => {
    pastRef.current = [];
    futureRef.current = [];
    setPresent(initial);
  }, []);

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
    snapshot,
  };
}
