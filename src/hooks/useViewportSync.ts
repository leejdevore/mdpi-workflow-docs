'use client';

import { useState, useCallback, useRef } from 'react';
import type { Viewport } from '@xyflow/react';

export function useViewportSync() {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const sourceRef = useRef<'left' | 'right' | null>(null);

  const handleLeftChange = useCallback((vp: Viewport) => {
    if (sourceRef.current !== 'right') {
      sourceRef.current = 'left';
      setViewport(vp);
      requestAnimationFrame(() => {
        sourceRef.current = null;
      });
    }
  }, []);

  const handleRightChange = useCallback((vp: Viewport) => {
    if (sourceRef.current !== 'left') {
      sourceRef.current = 'right';
      setViewport(vp);
      requestAnimationFrame(() => {
        sourceRef.current = null;
      });
    }
  }, []);

  return { viewport, setViewport, handleLeftChange, handleRightChange };
}
