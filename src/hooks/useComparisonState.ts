'use client';

import { useState, useCallback } from 'react';
import type { ViewId } from '@/data/types';
import type { ViewMode, OverlayConfig, SliderConfig } from '@/types/comparison';

export function useComparisonState() {
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [activeView, setActiveView] = useState<ViewId>('current');

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    primaryView: 'current',
    ghostViews: ['digitized'],
  });

  const [sliderConfig, setSliderConfig] = useState<SliderConfig>({
    leftView: 'current',
    rightView: 'digitized',
    dividerPosition: 50,
  });

  const setOverlayPrimary = useCallback((viewId: ViewId) => {
    setOverlayConfig((prev) => ({
      ...prev,
      primaryView: viewId,
      ghostViews: prev.ghostViews.filter((v) => v !== viewId),
    }));
  }, []);

  const toggleGhostView = useCallback((viewId: ViewId) => {
    setOverlayConfig((prev) => {
      if (viewId === prev.primaryView) return prev;
      const has = prev.ghostViews.includes(viewId);
      return {
        ...prev,
        ghostViews: has
          ? prev.ghostViews.filter((v) => v !== viewId)
          : [...prev.ghostViews, viewId],
      };
    });
  }, []);

  const setSliderLeftView = useCallback((viewId: ViewId) => {
    setSliderConfig((prev) => ({ ...prev, leftView: viewId }));
  }, []);

  const setSliderRightView = useCallback((viewId: ViewId) => {
    setSliderConfig((prev) => ({ ...prev, rightView: viewId }));
  }, []);

  const setDividerPosition = useCallback((position: number) => {
    setSliderConfig((prev) => ({ ...prev, dividerPosition: position }));
  }, []);

  return {
    viewMode,
    setViewMode,
    activeView,
    setActiveView,
    overlayConfig,
    setOverlayPrimary,
    toggleGhostView,
    sliderConfig,
    setSliderLeftView,
    setSliderRightView,
    setDividerPosition,
  };
}
