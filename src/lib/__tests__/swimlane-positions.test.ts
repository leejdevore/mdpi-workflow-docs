import { describe, it, expect } from 'vitest';
import {
  getLanePositionsForActors,
  getActorYForActors,
  getActorForYFromActors,
  getFlowStartX,
} from '../swimlane-positions';
import { LANE_HEIGHT, LANE_HEADER_WIDTH, LANE_PADDING } from '@/styles/flow-theme';
import type { ActorDefinition } from '@/types/workflow';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const actors: ActorDefinition[] = [
  { id: 'actor-a', label: 'Actor A', shortLabel: 'A', color: '#F00', order: 0 },
  { id: 'actor-b', label: 'Actor B', shortLabel: 'B', color: '#0F0', order: 1 },
  { id: 'actor-c', label: 'Actor C', shortLabel: 'C', color: '#00F', order: 2 },
];

// ---------------------------------------------------------------------------
// getLanePositionsForActors
// ---------------------------------------------------------------------------

describe('getLanePositionsForActors', () => {
  it('returns empty array for no actors', () => {
    expect(getLanePositionsForActors([])).toEqual([]);
  });

  it('assigns sequential Y positions using LANE_HEIGHT', () => {
    const positions = getLanePositionsForActors(actors);
    expect(positions).toHaveLength(3);
    expect(positions[0].y).toBe(0);
    expect(positions[1].y).toBe(LANE_HEIGHT);
    expect(positions[2].y).toBe(LANE_HEIGHT * 2);
  });

  it('every lane has LANE_HEIGHT height', () => {
    const positions = getLanePositionsForActors(actors);
    for (const pos of positions) {
      expect(pos.height).toBe(LANE_HEIGHT);
    }
  });

  it('carries over label, shortLabel, color, and id', () => {
    const positions = getLanePositionsForActors(actors);
    expect(positions[0].laneId).toBe('actor-a');
    expect(positions[0].label).toBe('Actor A');
    expect(positions[0].shortLabel).toBe('A');
    expect(positions[0].color).toBe('#F00');
  });

  it('sorts actors by order before positioning', () => {
    const unordered: ActorDefinition[] = [
      { id: 'z', label: 'Z', shortLabel: 'Z', color: '#000', order: 2 },
      { id: 'a', label: 'A', shortLabel: 'A', color: '#111', order: 0 },
      { id: 'm', label: 'M', shortLabel: 'M', color: '#222', order: 1 },
    ];
    const positions = getLanePositionsForActors(unordered);
    expect(positions[0].laneId).toBe('a');
    expect(positions[1].laneId).toBe('m');
    expect(positions[2].laneId).toBe('z');
  });

  it('handles single actor', () => {
    const positions = getLanePositionsForActors([actors[0]]);
    expect(positions).toHaveLength(1);
    expect(positions[0].y).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getActorYForActors
// ---------------------------------------------------------------------------

describe('getActorYForActors', () => {
  it('returns 0 for empty actors list', () => {
    expect(getActorYForActors('any', [])).toBe(0);
  });

  it('returns lane Y + LANE_PADDING for first actor', () => {
    const y = getActorYForActors('actor-a', actors);
    expect(y).toBe(0 + LANE_PADDING);
  });

  it('returns lane Y + LANE_PADDING for second actor', () => {
    const y = getActorYForActors('actor-b', actors);
    expect(y).toBe(LANE_HEIGHT + LANE_PADDING);
  });

  it('returns 0 for unknown actor', () => {
    const y = getActorYForActors('unknown', actors);
    expect(y).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getActorForYFromActors
// ---------------------------------------------------------------------------

describe('getActorForYFromActors', () => {
  it('returns null for empty actors list', () => {
    expect(getActorForYFromActors(50, [])).toBeNull();
  });

  it('returns first actor for Y within first lane', () => {
    const id = getActorForYFromActors(10, actors);
    expect(id).toBe('actor-a');
  });

  it('returns second actor for Y within second lane', () => {
    const id = getActorForYFromActors(LANE_HEIGHT + 10, actors);
    expect(id).toBe('actor-b');
  });

  it('returns third actor for Y within third lane', () => {
    const id = getActorForYFromActors(LANE_HEIGHT * 2 + 10, actors);
    expect(id).toBe('actor-c');
  });

  it('returns first actor for negative Y', () => {
    const id = getActorForYFromActors(-50, actors);
    expect(id).toBe('actor-a');
  });

  it('returns last actor for Y beyond all lanes', () => {
    const id = getActorForYFromActors(LANE_HEIGHT * 10, actors);
    expect(id).toBe('actor-c');
  });

  it('returns correct actor at exact lane boundary', () => {
    // Y exactly at start of second lane
    const id = getActorForYFromActors(LANE_HEIGHT, actors);
    expect(id).toBe('actor-b');
  });
});

// ---------------------------------------------------------------------------
// getFlowStartX
// ---------------------------------------------------------------------------

describe('getFlowStartX', () => {
  it('returns LANE_HEADER_WIDTH + 40', () => {
    expect(getFlowStartX()).toBe(LANE_HEADER_WIDTH + 40);
  });
});
