'use client';

import { ArrowLeftRight } from 'lucide-react';
import type { ViewId } from '@/data/types';
import type { SliderConfig } from '@/types/comparison';
import { getAllViewIds } from '@/data';

const viewLabels: Record<ViewId, string> = {
  current: 'Current State',
  digitized: 'Digitized',
  transformed: 'Digitally Transformed',
};

interface SliderControlsProps {
  config: SliderConfig;
  onSetLeft: (viewId: ViewId) => void;
  onSetRight: (viewId: ViewId) => void;
  onSwap: () => void;
}

export function SliderControls({ config, onSetLeft, onSetRight, onSwap }: SliderControlsProps) {
  const allViews = getAllViewIds();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Left:</span>
        <select
          value={config.leftView}
          onChange={(e) => onSetLeft(e.target.value as ViewId)}
          className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700"
        >
          {allViews.map((id) => (
            <option key={id} value={id}>{viewLabels[id]}</option>
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
          onChange={(e) => onSetRight(e.target.value as ViewId)}
          className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700"
        >
          {allViews.map((id) => (
            <option key={id} value={id}>{viewLabels[id]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
