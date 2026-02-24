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
import { EditModeProvider } from '@/contexts/EditModeContext';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { Header } from '@/components/layout/Header';
import { LeftNav } from '@/components/nav/LeftNav';

export default function DiagramPage() {
  const {
    selection,
    activeWorkflow,
    activeScenarios,
    steps,
    edges,
    dataLoading,
    actors,
    phases,
    selectScenario,
  } = useWorkflowContext();

  const {
    viewMode,
    setViewMode,
    overlayConfig,
    setOverlayPrimary,
    toggleGhostView,
    sliderConfig,
    setSliderLeftView,
    setSliderRightView,
    setDividerPosition,
  } = useComparisonState(activeScenarios);

  const handleSliderSwap = useCallback(() => {
    const left = sliderConfig.leftView;
    const right = sliderConfig.rightView;
    setSliderLeftView(right);
    setSliderRightView(left);
  }, [sliderConfig.leftView, sliderConfig.rightView, setSliderLeftView, setSliderRightView]);

  return (
    <>
      {/* Left sidebar */}
      <LeftNav />

      {/* Main content */}
      <EditModeProvider viewMode={viewMode}>
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <Header
            title={activeWorkflow?.name ?? 'Workflow'}
            subtitle={activeWorkflow?.description}
          />

          {/* Control bar */}
          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200">
            {/* Left side: scenario tabs or comparison controls */}
            <div className="flex items-center gap-1">
              {viewMode === 'tabs' && (
                <>
                  {activeScenarios.map((scenario) => {
                    const isActive = selection?.scenarioId === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => {
                          if (selection?.workflowId) {
                            selectScenario(selection.workflowId, scenario.id);
                          }
                        }}
                        className={`
                          px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                          ${isActive
                            ? 'bg-white text-slate-900 border border-slate-200 border-b-white -mb-px'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                          }
                        `}
                      >
                        {scenario.name}
                      </button>
                    );
                  })}
                </>
              )}

              {viewMode === 'overlay' && (
                <OverlayControls
                  config={overlayConfig}
                  scenarios={activeScenarios}
                  onSetPrimary={setOverlayPrimary}
                  onToggleGhost={toggleGhostView}
                />
              )}

              {viewMode === 'slider' && (
                <SliderControls
                  config={sliderConfig}
                  scenarios={activeScenarios}
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
            {dataLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-slate-400">Loading...</div>
              </div>
            ) : viewMode === 'tabs' ? (
              <ReactFlowProvider key={selection?.scenarioId ?? 'empty'}>
                <SwimlaneDiagram
                  steps={steps}
                  edges={edges}
                  actors={actors}
                  phases={phases}
                />
              </ReactFlowProvider>
            ) : viewMode === 'overlay' ? (
              <OverlayDiagram
                config={overlayConfig}
                scenarios={activeScenarios}
                actors={actors}
                phases={phases}
              />
            ) : (
              <SliderDiagram
                config={sliderConfig}
                scenarios={activeScenarios}
                actors={actors}
                phases={phases}
                onDividerChange={setDividerPosition}
              />
            )}
          </div>
        </div>
      </EditModeProvider>
    </>
  );
}
