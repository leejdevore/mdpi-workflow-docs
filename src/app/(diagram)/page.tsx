'use client';

import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { SwimlaneDiagram } from '@/components/flow/SwimlaneDiagram';
import { ViewId } from '@/data/types';
import { getWorkflowView, getAllViewIds } from '@/data';

const viewLabels: Record<ViewId, string> = {
  current: 'Current State',
  digitized: 'Digitized',
  transformed: 'Digitally Transformed',
};

export default function DiagramPage() {
  const [activeView, setActiveView] = useState<ViewId>('current');

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 bg-slate-50 border-b border-slate-200">
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
      </div>

      {/* Diagram */}
      <div className="flex-1">
        <ReactFlowProvider>
          <SwimlaneDiagram viewId={activeView} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
