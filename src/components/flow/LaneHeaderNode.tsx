'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { LaneHeaderData } from '@/hooks/useWorkflowData';
import { LANE_HEIGHT } from '@/styles/flow-theme';

function LaneHeaderComponent({ data }: NodeProps) {
  const laneData = data as unknown as LaneHeaderData;

  return (
    <div
      className="flex items-center justify-center rounded-l-lg border-r-2 border-slate-200 px-3"
      style={{
        backgroundColor: laneData.color,
        height: LANE_HEIGHT,
        width: '100%',
      }}
    >
      <div className="text-center">
        <p className="text-xs font-bold text-slate-700 leading-tight">
          {laneData.shortLabel}
        </p>
        <p className="text-[9px] text-slate-500 leading-tight mt-0.5 max-w-[150px]">
          {laneData.label}
        </p>
      </div>
    </div>
  );
}

export const LaneHeaderNode = memo(LaneHeaderComponent);
