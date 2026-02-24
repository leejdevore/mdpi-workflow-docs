import { lanes } from '@/data/lanes';
import { ActorId } from '@/data/types';
import type { ActorDefinition } from '@/types/workflow';
import { LANE_HEIGHT, LANE_HEADER_WIDTH, LANE_PADDING } from '@/styles/flow-theme';

export interface LanePosition {
  laneId: string;
  label: string;
  shortLabel: string;
  color: string;
  y: number;
  height: number;
}

/** Calculate Y positions for each lane (top-to-bottom stacking) — legacy version using global lanes */
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

/** Calculate Y positions from ActorDefinition[] (parameterized version) */
export function getLanePositionsForActors(actors: ActorDefinition[]): LanePosition[] {
  if (actors.length === 0) return getLanePositions();
  const sorted = [...actors].sort((a, b) => a.order - b.order);
  const positions: LanePosition[] = [];
  let currentY = 0;

  for (const actor of sorted) {
    positions.push({
      laneId: actor.id,
      label: actor.label,
      shortLabel: actor.shortLabel,
      color: actor.color,
      y: currentY,
      height: LANE_HEIGHT,
    });
    currentY += LANE_HEIGHT;
  }

  return positions;
}

/** Get the Y center position for a given actor — legacy */
export function getActorY(actorId: ActorId): number {
  const positions = getLanePositions();
  const lane = lanes.find((l) => l.actors.includes(actorId));
  if (!lane) return 0;
  const pos = positions.find((p) => p.laneId === lane.id);
  if (!pos) return 0;
  return pos.y + LANE_PADDING;
}

/** Get the Y position for an actor using ActorDefinition[] (parameterized version) */
export function getActorYForActors(actorId: string, actors: ActorDefinition[]): number {
  if (actors.length === 0) return getActorY(actorId as ActorId);
  const positions = getLanePositionsForActors(actors);
  const pos = positions.find((p) => p.laneId === actorId);
  if (!pos) return 0;
  return pos.y + LANE_PADDING;
}

/** Given a Y coordinate, return the ActorId for the lane at that position — legacy */
export function getActorForY(y: number): ActorId | null {
  const positions = getLanePositions();
  for (const pos of positions) {
    if (y >= pos.y && y < pos.y + pos.height) {
      const lane = lanes.find((l) => l.id === pos.laneId);
      return lane ? (lane.actors[0] as ActorId) : null;
    }
  }
  if (positions.length === 0) return null;
  if (y < 0) {
    const firstLane = lanes.find((l) => l.id === positions[0].laneId);
    return firstLane ? (firstLane.actors[0] as ActorId) : null;
  }
  const lastPos = positions[positions.length - 1];
  const lastLane = lanes.find((l) => l.id === lastPos.laneId);
  return lastLane ? (lastLane.actors[0] as ActorId) : null;
}

/** Given a Y coordinate + actors list, return the actor ID (parameterized version) */
export function getActorForYFromActors(y: number, actors: ActorDefinition[]): string | null {
  if (actors.length === 0) return getActorForY(y);
  const positions = getLanePositionsForActors(actors);
  for (const pos of positions) {
    if (y >= pos.y && y < pos.y + pos.height) {
      return pos.laneId;
    }
  }
  if (positions.length === 0) return null;
  if (y < 0) return positions[0].laneId;
  return positions[positions.length - 1].laneId;
}

/** Total height of all lanes */
export function getTotalLanesHeight(): number {
  return lanes.length * LANE_HEIGHT;
}

/** X offset for the start of the flow area (after lane headers) */
export function getFlowStartX(): number {
  return LANE_HEADER_WIDTH + 40;
}
