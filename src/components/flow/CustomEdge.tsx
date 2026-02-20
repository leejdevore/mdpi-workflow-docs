'use client';

import { memo } from 'react';
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { useEditMode } from '@/contexts/EditModeContext';

function CustomEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  label,
  labelStyle,
  labelBgStyle,
}: EdgeProps) {
  const { isEditMode } = useEditMode();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      {/* Wider invisible hit area for clicking in edit mode */}
      {isEditMode && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          className="cursor-pointer"
        />
      )}
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`absolute px-1.5 py-0.5 rounded text-[10px] ${isEditMode ? 'pointer-events-auto cursor-pointer hover:ring-2 hover:ring-blue-400' : 'pointer-events-none'}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              ...labelBgStyle,
              ...labelStyle,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
