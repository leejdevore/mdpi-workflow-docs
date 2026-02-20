'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { GhostNodeData } from '@/hooks/useOverlayData';
import { stepTypeColors, viewColors, GHOST_OPACITY } from '@/styles/flow-theme';

function GhostProcessNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as GhostNodeData;
  const colors = stepTypeColors[nodeData.stepType];
  const viewColor = viewColors[nodeData.ghostViewId] ?? '#94A3B8';

  return (
    <div
      className="rounded-lg border-2 shadow-sm px-3 py-2"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        width: '100%',
        height: '100%',
        opacity: GHOST_OPACITY,
        filter: 'saturate(0.15)',
        pointerEvents: 'none',
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400" style={{ opacity: 0 }} />

      {/* View badge */}
      <span
        className="absolute -top-1.5 -right-1.5 text-[7px] font-bold text-white px-1 py-0.5 rounded"
        style={{ backgroundColor: viewColor }}
      >
        {nodeData.ghostViewLabel}
      </span>

      <div className="flex items-start gap-2">
        {nodeData.stepNumber != null && (
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold mt-0.5"
            style={{ backgroundColor: colors.badge }}
          >
            {nodeData.stepNumber}
          </span>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-xs font-semibold leading-tight line-clamp-2"
            style={{ color: colors.text }}
          >
            {nodeData.title}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400" style={{ opacity: 0 }} />
    </div>
  );
}

export const GhostProcessNode = memo(GhostProcessNodeComponent);
