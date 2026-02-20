'use client';

import { memo } from 'react';
import { useViewport } from '@xyflow/react';
import type { LanePosition } from '@/lib/swimlane-positions';

interface SwimlaneBackgroundProps {
  lanePositions: LanePosition[];
  totalWidth: number;
}

function SwimlaneBackgroundComponent({ lanePositions, totalWidth }: SwimlaneBackgroundProps) {
  const { x, y, zoom } = useViewport();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {lanePositions.map((lane, index) => (
          <div
            key={lane.laneId}
            className="absolute"
            style={{
              top: lane.y,
              left: 0,
              width: Math.max(totalWidth, 12000),
              height: lane.height,
              backgroundColor: lane.color,
              opacity: 0.3,
              borderBottom: index < lanePositions.length - 1 ? '1px solid #CBD5E1' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const SwimlaneBackground = memo(SwimlaneBackgroundComponent);
