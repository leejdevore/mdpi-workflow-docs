'use client';

import { ArrowLeftRight } from 'lucide-react';
import type { Scenario, UUID } from '@/types/workflow';
import type { SliderConfig } from '@/types/comparison';

interface SliderControlsProps {
  config: SliderConfig;
  scenarios: Scenario[];
  onSetLeft: (scenarioId: UUID) => void;
  onSetRight: (scenarioId: UUID) => void;
  onSwap: () => void;
}

export function SliderControls({ config, scenarios, onSetLeft, onSetRight, onSwap }: SliderControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Left:</span>
        <select
          value={config.leftView}
          onChange={(e) => onSetLeft(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <button
        onClick={onSwap}
        className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
        title="Swap views"
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Right:</span>
        <select
          value={config.rightView}
          onChange={(e) => onSetRight(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
