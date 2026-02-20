'use client';

import type { ViewId } from '@/data/types';
import type { OverlayConfig } from '@/types/comparison';
import { getAllViewIds } from '@/data';
import { viewColors } from '@/styles/flow-theme';

const viewLabels: Record<ViewId, string> = {
  current: 'Current State',
  digitized: 'Digitized',
  transformed: 'Digitally Transformed',
};

interface OverlayControlsProps {
  config: OverlayConfig;
  onSetPrimary: (viewId: ViewId) => void;
  onToggleGhost: (viewId: ViewId) => void;
}

export function OverlayControls({ config, onSetPrimary, onToggleGhost }: OverlayControlsProps) {
  const allViews = getAllViewIds();

  return (
    <div className="flex items-center gap-4">
      {/* Primary view selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Primary:</span>
        <select
          value={config.primaryView}
          onChange={(e) => onSetPrimary(e.target.value as ViewId)}
          className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700"
        >
          {allViews.map((id) => (
            <option key={id} value={id}>{viewLabels[id]}</option>
          ))}
        </select>
      </div>

      {/* Ghost view toggles */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">Compare:</span>
        {allViews
          .filter((id) => id !== config.primaryView)
          .map((id) => {
            const isActive = config.ghostViews.includes(id);
            return (
              <button
                key={id}
                onClick={() => onToggleGhost(id)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors
                  ${isActive
                    ? 'border-slate-300 bg-white text-slate-700 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }
                `}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: viewColors[id],
                    opacity: isActive ? 1 : 0.3,
                  }}
                />
                {viewLabels[id]}
              </button>
            );
          })}
      </div>
    </div>
  );
}
