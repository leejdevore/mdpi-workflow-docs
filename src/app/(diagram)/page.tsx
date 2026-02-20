'use client';

import { useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { SwimlaneDiagram } from '@/components/flow/SwimlaneDiagram';
import { ViewModeSelector } from '@/components/comparison/ViewModeSelector';
import { OverlayControls } from '@/components/comparison/OverlayControls';
import { OverlayDiagram } from '@/components/comparison/OverlayDiagram';
import { SliderControls } from '@/components/comparison/SliderControls';
import { SliderDiagram } from '@/components/comparison/SliderDiagram';
import { useComparisonState } from '@/hooks/useComparisonState';
import { ViewId } from '@/data/types';
import { getWorkflowView, getAllViewIds } from '@/data';

const viewLabels: Record<ViewId, string> = {
  current: 'Current State',
  digitized: 'Digitized',
  transformed: 'Digitally Transformed',
};

export default function DiagramPage() {
  const {
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
  } = useComparisonState();

  const handleSliderSwap = useCallback(() => {
    const left = sliderConfig.leftView;
    const right = sliderConfig.rightView;
    setSliderLeftView(right);
    setSliderRightView(left);
  }, [sliderConfig.leftView, sliderConfig.rightView, setSliderLeftView, setSliderRightView]);

  return (
    <div className="flex flex-col h-full">
      {/* Control bar */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200">
        {/* Left side: mode-specific controls */}
        <div className="flex items-center gap-1">
          {viewMode === 'tabs' && (
            <>
              {getAllViewIds().map((viewId) => {
                const view = getWorkflowView(viewId);
                const isActive = viewId === activeView;
                const hasSteps = view.steps.length > 0;

                return (
                  <button
                    key={viewId}
                    onClick={() => setActiveView(viewId)}
                    disabled={!hasSteps}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                      ${isActive
                        ? 'bg-white text-slate-900 border border-slate-200 border-b-white -mb-px'
                        : hasSteps
                          ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 cursor-not-allowed'
                      }
                    `}
                  >
                    {viewLabels[viewId]}
                    {!hasSteps && (
                      <span className="ml-1 text-[10px] text-slate-400">(Coming Soon)</span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {viewMode === 'overlay' && (
            <OverlayControls
              config={overlayConfig}
              onSetPrimary={setOverlayPrimary}
              onToggleGhost={toggleGhostView}
            />
          )}

          {viewMode === 'slider' && (
            <SliderControls
              config={sliderConfig}
              onSetLeft={setSliderLeftView}
              onSetRight={setSliderRightView}
              onSwap={handleSliderSwap}
            />
          )}
        </div>

        {/* Right side: view mode selector */}
        <ViewModeSelector mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Diagram area */}
      <div className="flex-1">
        {viewMode === 'tabs' && (
          <ReactFlowProvider key={activeView}>
            <SwimlaneDiagram viewId={activeView} />
          </ReactFlowProvider>
        )}

        {viewMode === 'overlay' && (
          <OverlayDiagram config={overlayConfig} />
        )}

        {viewMode === 'slider' && (
          <SliderDiagram config={sliderConfig} onDividerChange={setDividerPosition} />
        )}
      </div>
    </div>
  );
}
