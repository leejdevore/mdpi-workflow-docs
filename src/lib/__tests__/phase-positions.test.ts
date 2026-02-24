import { describe, it, expect } from 'vitest';
import { getPhasePositionsFromData } from '../phase-positions';
import { COLUMN_GAP } from '@/styles/flow-theme';
import { getFlowStartX } from '../swimlane-positions';
import type { WorkflowStep, PhaseDefinition } from '@/types/workflow';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStep(overrides: Partial<WorkflowStep> & { id: string; phaseId: string; column: number }): WorkflowStep {
  return {
    versionId: 'v1',
    title: 'Test',
    description: '',
    actorId: 'a1',
    stepType: 'manual',
    documents: [],
    painPoints: [],
    improvements: [],
    toolsUsed: [],
    subItems: [],
    shape: 'process',
    ...overrides,
  };
}

const phases: PhaseDefinition[] = [
  { id: 'phase-a', label: 'Phase A', color: '#AAA', order: 0 },
  { id: 'phase-b', label: 'Phase B', color: '#BBB', order: 1 },
];

// ---------------------------------------------------------------------------
// getPhasePositionsFromData
// ---------------------------------------------------------------------------

describe('getPhasePositionsFromData', () => {
  it('returns empty array for no steps', () => {
    expect(getPhasePositionsFromData([], phases)).toEqual([]);
  });

  it('computes position for a single step', () => {
    const steps = [makeStep({ id: 's1', phaseId: 'phase-a', column: 0 })];
    const result = getPhasePositionsFromData(steps, phases);
    const flowStartX = getFlowStartX();

    expect(result).toHaveLength(1);
    expect(result[0].phaseId).toBe('phase-a');
    expect(result[0].label).toBe('Phase A');
    expect(result[0].color).toBe('#AAA');
    expect(result[0].minColumn).toBe(0);
    expect(result[0].maxColumn).toBe(0);
    expect(result[0].x).toBe(flowStartX + 0 * COLUMN_GAP - 30);
    expect(result[0].width).toBe(1 * COLUMN_GAP + 40);
  });

  it('groups multiple steps in the same phase', () => {
    const steps = [
      makeStep({ id: 's1', phaseId: 'phase-a', column: 0 }),
      makeStep({ id: 's2', phaseId: 'phase-a', column: 2 }),
      makeStep({ id: 's3', phaseId: 'phase-a', column: 1 }),
    ];
    const result = getPhasePositionsFromData(steps, phases);
    expect(result).toHaveLength(1);
    expect(result[0].minColumn).toBe(0);
    expect(result[0].maxColumn).toBe(2);
    expect(result[0].width).toBe(3 * COLUMN_GAP + 40);
  });

  it('separates different phases', () => {
    const steps = [
      makeStep({ id: 's1', phaseId: 'phase-a', column: 0 }),
      makeStep({ id: 's2', phaseId: 'phase-b', column: 3 }),
    ];
    const result = getPhasePositionsFromData(steps, phases);
    expect(result).toHaveLength(2);
    // Sorted by minColumn
    expect(result[0].phaseId).toBe('phase-a');
    expect(result[1].phaseId).toBe('phase-b');
  });

  it('sorts phases by minColumn', () => {
    const steps = [
      makeStep({ id: 's1', phaseId: 'phase-b', column: 0 }),
      makeStep({ id: 's2', phaseId: 'phase-a', column: 5 }),
    ];
    const result = getPhasePositionsFromData(steps, phases);
    // phase-b has lower column so comes first
    expect(result[0].phaseId).toBe('phase-b');
    expect(result[1].phaseId).toBe('phase-a');
  });

  it('falls back to phaseId as label when phase not in definitions', () => {
    const steps = [makeStep({ id: 's1', phaseId: 'unknown-phase', column: 0 })];
    const result = getPhasePositionsFromData(steps, []);
    expect(result[0].label).toBe('unknown-phase');
  });

  it('uses legacy phaseLabels when phase not in definitions but in legacy map', () => {
    const steps = [makeStep({ id: 's1', phaseId: 'pre-draw', column: 0 })];
    const result = getPhasePositionsFromData(steps, []);
    expect(result[0].label).toBe('Pre-Draw');
  });

  it('uses legacy phaseColors when phase not in definitions but in legacy map', () => {
    const steps = [makeStep({ id: 's1', phaseId: 'pre-draw', column: 0 })];
    const result = getPhasePositionsFromData(steps, []);
    expect(result[0].color).toBe('#F1F5F9');
  });

  it('uses default color when phase not in definitions or legacy map', () => {
    const steps = [makeStep({ id: 's1', phaseId: 'totally-unknown', column: 0 })];
    const result = getPhasePositionsFromData(steps, []);
    expect(result[0].color).toBe('#F1F5F9');
  });
});
