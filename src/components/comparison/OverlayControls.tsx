'use client';

import type { Scenario, UUID } from '@/types/workflow';
import type { OverlayConfig } from '@/types/comparison';

const scenarioTypeColors: Record<string, string> = {
  existing: '#EF4444',
  digitized: '#3B82F6',
  transformed: '#10B981',
  custom: '#8B5CF6',
};

interface OverlayControlsProps {
  config: OverlayConfig;
  scenarios: Scenario[];
  onSetPrimary: (scenarioId: UUID) => void;
  onToggleGhost: (scenarioId: UUID) => void;
}

export function OverlayControls({ config, scenarios, onSetPrimary, onToggleGhost }: OverlayControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Primary view selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Primary:</span>
        <select
          value={config.primaryView}
          onChange={(e) => onSetPrimary(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Ghost view toggles */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">Compare:</span>
        {scenarios
          .filter((s) => s.id !== config.primaryView)
          .map((s) => {
            const isActive = config.ghostViews.includes(s.id);
            const color = scenarioTypeColors[s.scenarioType] ?? '#64748B';
            return (
              <button
                key={s.id}
                onClick={() => onToggleGhost(s.id)}
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
                    backgroundColor: color,
                    opacity: isActive ? 1 : 0.3,
                  }}
                />
                {s.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}
