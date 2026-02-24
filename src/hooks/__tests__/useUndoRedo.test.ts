import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';

describe('useUndoRedo', () => {
  it('returns the initial state', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    expect(result.current.state).toBe(0);
  });

  it('updates state with setState', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    act(() => {
      result.current.setState('updated');
    });
    expect(result.current.state).toBe('updated');
  });

  it('canUndo is false initially', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    expect(result.current.canUndo).toBe(false);
  });

  it('canRedo is false initially', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    expect(result.current.canRedo).toBe(false);
  });

  it('canUndo is true after snapshot + setState', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => {
      result.current.snapshot();
      result.current.setState(1);
    });
    expect(result.current.canUndo).toBe(true);
  });

  it('undo restores previous state', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => {
      result.current.snapshot();
      result.current.setState(1);
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe(0);
  });

  it('canRedo is true after undo', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => {
      result.current.snapshot();
      result.current.setState(1);
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);
  });

  it('redo restores undone state', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => {
      result.current.snapshot();
      result.current.setState(1);
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe(1);
  });

  it('undo does nothing when history is empty', () => {
    const { result } = renderHook(() => useUndoRedo(42));
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe(42);
  });

  it('redo does nothing when future is empty', () => {
    const { result } = renderHook(() => useUndoRedo(42));
    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe(42);
  });

  it('snapshot clears redo history', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    // Make history: 0 -> 1
    act(() => {
      result.current.snapshot();
      result.current.setState(1);
    });
    // Undo back to 0
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    // New snapshot + change clears redo
    act(() => {
      result.current.snapshot();
      result.current.setState(2);
    });
    expect(result.current.canRedo).toBe(false);
  });

  it('supports multiple undo/redo steps', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    // a -> b -> c
    act(() => {
      result.current.snapshot();
      result.current.setState('b');
    });
    act(() => {
      result.current.snapshot();
      result.current.setState('c');
    });
    expect(result.current.state).toBe('c');

    // Undo twice: c -> b -> a
    act(() => { result.current.undo(); });
    expect(result.current.state).toBe('b');
    act(() => { result.current.undo(); });
    expect(result.current.state).toBe('a');

    // Redo twice: a -> b -> c
    act(() => { result.current.redo(); });
    expect(result.current.state).toBe('b');
    act(() => { result.current.redo(); });
    expect(result.current.state).toBe('c');
  });

  it('respects maxHistory limit', () => {
    const maxHistory = 3;
    const { result } = renderHook(() => useUndoRedo(0, maxHistory));

    // Push 5 snapshots (exceeding max of 3)
    for (let i = 1; i <= 5; i++) {
      act(() => {
        result.current.snapshot();
        result.current.setState(i);
      });
    }
    expect(result.current.state).toBe(5);

    // Should only be able to undo 3 times (maxHistory)
    let undoCount = 0;
    while (result.current.canUndo) {
      act(() => { result.current.undo(); });
      undoCount++;
    }
    expect(undoCount).toBe(maxHistory);
  });

  it('reset clears all history and sets new state', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => {
      result.current.snapshot();
      result.current.setState(1);
    });
    act(() => {
      result.current.snapshot();
      result.current.setState(2);
    });
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.reset(99);
    });
    expect(result.current.state).toBe(99);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('works with complex objects', () => {
    const initial = { items: [1, 2, 3], name: 'test' };
    const { result } = renderHook(() => useUndoRedo(initial));

    const updated = { items: [1, 2, 3, 4], name: 'updated' };
    act(() => {
      result.current.snapshot();
      result.current.setState(updated);
    });
    expect(result.current.state).toEqual(updated);

    act(() => { result.current.undo(); });
    expect(result.current.state).toEqual(initial);
  });
});
