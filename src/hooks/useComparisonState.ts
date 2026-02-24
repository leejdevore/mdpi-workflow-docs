'use client';

import { useState, useCallback, useEffect } from 'react';
import type { UUID, Scenario } from '@/types/workflow';
import type { ViewMode, OverlayConfig, SliderConfig } from '@/types/comparison';

export function useComparisonState(scenarios: Scenario[]) {
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    primaryView: '',
    ghostViews: [],
  });

  const [sliderConfig, setSliderConfig] = useState<SliderConfig>({
    leftView: '',
    rightView: '',
    dividerPosition: 50,
  });

  // Update configs when scenarios change (e.g., switching workflows)
  useEffect(() => {
    if (scenarios.length === 0) return;
    const first = scenarios[0].id;
    const second = scenarios[1]?.id ?? first;

    setOverlayConfig((prev) => {
      const primaryValid = scenarios.some((s) => s.id === prev.primaryView);
      return {
        primaryView: primaryValid ? prev.primaryView : first,
        ghostViews: primaryValid
          ? prev.ghostViews.filter((id) => scenarios.some((s) => s.id === id))
          : second !== first ? [second] : [],
      };
    });

    setSliderConfig((prev) => {
      const leftValid = scenarios.some((s) => s.id === prev.leftView);
      const rightValid = scenarios.some((s) => s.id === prev.rightView);
      return {
        leftView: leftValid ? prev.leftView : first,
        rightView: rightValid ? prev.rightView : second,
        dividerPosition: prev.dividerPosition,
      };
    });
  }, [scenarios]);

  const setOverlayPrimary = useCallback((scenarioId: UUID) => {
    setOverlayConfig((prev) => ({
      ...prev,
      primaryView: scenarioId,
      ghostViews: prev.ghostViews.filter((v) => v !== scenarioId),
    }));
  }, []);

  const toggleGhostView = useCallback((scenarioId: UUID) => {
    setOverlayConfig((prev) => {
      if (scenarioId === prev.primaryView) return prev;
      const has = prev.ghostViews.includes(scenarioId);
      return {
        ...prev,
        ghostViews: has
          ? prev.ghostViews.filter((v) => v !== scenarioId)
          : [...prev.ghostViews, scenarioId],
      };
    });
  }, []);

  const setSliderLeftView = useCallback((scenarioId: UUID) => {
    setSliderConfig((prev) => ({ ...prev, leftView: scenarioId }));
  }, []);

  const setSliderRightView = useCallback((scenarioId: UUID) => {
    setSliderConfig((prev) => ({ ...prev, rightView: scenarioId }));
  }, []);

  const setDividerPosition = useCallback((position: number) => {
    setSliderConfig((prev) => ({ ...prev, dividerPosition: position }));
  }, []);

  return {
    viewMode,
    setViewMode,
    overlayConfig,
    setOverlayPrimary,
    toggleGhostView,
    sliderConfig,
    setSliderLeftView,
    setSliderRightView,
    setDividerPosition,
  };
}
