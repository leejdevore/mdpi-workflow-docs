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

/** Calculate Y positions from ActorDefinition[] */
export function getLanePositionsForActors(actors: ActorDefinition[]): LanePosition[] {
  if (actors.length === 0) return [];
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

/** Get the Y position for an actor using ActorDefinition[] */
export function getActorYForActors(actorId: string, actors: ActorDefinition[]): number {
  if (actors.length === 0) return 0;
  const positions = getLanePositionsForActors(actors);
  const pos = positions.find((p) => p.laneId === actorId);
  if (!pos) return 0;
  return pos.y + LANE_PADDING;
}

/** Given a Y coordinate + actors list, return the actor ID */
export function getActorForYFromActors(y: number, actors: ActorDefinition[]): string | null {
  if (actors.length === 0) return null;
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

/** X offset for the start of the flow area (after lane headers) */
export function getFlowStartX(): number {
  return LANE_HEADER_WIDTH + 40;
}
