import { lanes } from '@/data/lanes';
import { ActorId } from '@/data/types';
import { LANE_HEIGHT, LANE_HEADER_WIDTH, LANE_PADDING } from '@/styles/flow-theme';

export interface LanePosition {
  laneId: string;
  label: string;
  shortLabel: string;
  color: string;
  y: number;
  height: number;
}

/** Calculate Y positions for each lane (top-to-bottom stacking) */
export function getLanePositions(): LanePosition[] {
  const sorted = [...lanes].sort((a, b) => a.order - b.order);
  const positions: LanePosition[] = [];
  let currentY = 0;

  for (const lane of sorted) {
    positions.push({
      laneId: lane.id,
      label: lane.label,
      shortLabel: lane.shortLabel,
      color: lane.color,
      y: currentY,
      height: LANE_HEIGHT,
    });
    currentY += LANE_HEIGHT;
  }

  return positions;
}

/** Get the Y center position for a given actor */
export function getActorY(actorId: ActorId): number {
  const positions = getLanePositions();
  const lane = lanes.find((l) => l.actors.includes(actorId));
  if (!lane) return 0;

  const pos = positions.find((p) => p.laneId === lane.id);
  if (!pos) return 0;

  // Center the node vertically within the lane
  return pos.y + LANE_PADDING;
}

/** Total height of all lanes */
export function getTotalLanesHeight(): number {
  return lanes.length * LANE_HEIGHT;
}

/** X offset for the start of the flow area (after lane headers) */
export function getFlowStartX(): number {
  return LANE_HEADER_WIDTH + 40;
}
