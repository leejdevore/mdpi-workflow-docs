'use client';

import { memo } from 'react';
import { useViewport } from '@xyflow/react';
import type { LanePosition } from '@/lib/swimlane-positions';
import type { PhasePosition } from '@/lib/phase-positions';
import { PHASE_HEADER_HEIGHT } from '@/styles/flow-theme';

interface SwimlaneBackgroundProps {
  lanePositions: LanePosition[];
  phasePositions?: PhasePosition[];
  totalWidth: number;
}

function SwimlaneBackgroundComponent({ lanePositions, phasePositions, totalWidth }: SwimlaneBackgroundProps) {
  const { x, y, zoom } = useViewport();

  // Calculate offset — lanes are shifted down by PHASE_HEADER_HEIGHT
  const yOffset = PHASE_HEADER_HEIGHT;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Phase column backgrounds — vertical stripes spanning all lanes */}
        {phasePositions && phasePositions.map((phase) => (
          <div
            key={`phase-bg-${phase.phaseId}`}
            className="absolute"
            style={{
              top: yOffset,
              left: phase.x,
              width: phase.width,
              height: lanePositions.length * lanePositions[0]?.height || 0,
              backgroundColor: phase.color,
              opacity: 0.15,
              borderLeft: '1px solid #E2E8F0',
              borderRight: '1px solid #E2E8F0',
            }}
          />
        ))}

        {/* Lane horizontal bands */}
        {lanePositions.map((lane, index) => (
          <div
            key={lane.laneId}
            className="absolute"
            style={{
              top: lane.y + yOffset,
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
