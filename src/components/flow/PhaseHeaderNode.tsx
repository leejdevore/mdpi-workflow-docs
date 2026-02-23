'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { PHASE_HEADER_HEIGHT } from '@/styles/flow-theme';

export interface PhaseHeaderData {
  label: string;
  color: string;
  phaseWidth: number;
  [key: string]: unknown;
}

function PhaseHeaderComponent({ data }: NodeProps) {
  const phaseData = data as unknown as PhaseHeaderData;

  return (
    <div
      className="flex items-center justify-center border-b-2 border-slate-300 rounded-t-lg"
      style={{
        backgroundColor: phaseData.color,
        height: PHASE_HEADER_HEIGHT,
        width: phaseData.phaseWidth,
        opacity: 0.85,
      }}
    >
      <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
        {phaseData.label}
      </span>
    </div>
  );
}

export const PhaseHeaderNode = memo(PhaseHeaderComponent);
