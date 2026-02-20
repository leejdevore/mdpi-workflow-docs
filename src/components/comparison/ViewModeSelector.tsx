'use client';

import { Layers, SplitSquareHorizontal, LayoutGrid } from 'lucide-react';
import type { ViewMode } from '@/types/comparison';

interface ViewModeSelectorProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const modes: { id: ViewMode; label: string; icon: typeof Layers }[] = [
  { id: 'tabs', label: 'Tabs', icon: LayoutGrid },
  { id: 'overlay', label: 'Overlay', icon: Layers },
  { id: 'slider', label: 'Slider', icon: SplitSquareHorizontal },
];

export function ViewModeSelector({ mode, onChange }: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 bg-slate-200 rounded-lg p-0.5">
      {modes.map(({ id, label, icon: Icon }) => {
        const isActive = mode === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
