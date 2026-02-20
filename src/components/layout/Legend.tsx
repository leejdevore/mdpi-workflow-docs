'use client';

import { stepTypeColors } from '@/styles/flow-theme';

const items = [
  { type: 'manual' as const, label: 'Manual' },
  { type: 'automated' as const, label: 'Automated' },
  { type: 'data-driven' as const, label: 'Data-Driven' },
  { type: 'hybrid' as const, label: 'Hybrid' },
];

export function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs">
      {items.map(({ type, label }) => {
        const colors = stepTypeColors[type];
        return (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded border-2"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            />
            <span className="text-slate-600">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
