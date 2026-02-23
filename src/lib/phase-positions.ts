import type { WorkflowStep, ProcessPhase } from '@/data/types';
import { COLUMN_GAP, phaseColors, phaseLabels } from '@/styles/flow-theme';
import { getFlowStartX } from './swimlane-positions';

export interface PhasePosition {
  phaseId: ProcessPhase;
  label: string;
  color: string;
  x: number;
  width: number;
  minColumn: number;
  maxColumn: number;
}

/**
 * Compute phase header positions by grouping steps into their phases,
 * finding the min/max column per phase, and computing X/width from COLUMN_GAP.
 */
export function getPhasePositions(steps: WorkflowStep[]): PhasePosition[] {
  if (steps.length === 0) return [];

  const flowStartX = getFlowStartX();

  // Group by phase, find min/max column
  const phaseMap = new Map<ProcessPhase, { min: number; max: number }>();

  for (const step of steps) {
    const existing = phaseMap.get(step.phase);
    if (existing) {
      existing.min = Math.min(existing.min, step.column);
      existing.max = Math.max(existing.max, step.column);
    } else {
      phaseMap.set(step.phase, { min: step.column, max: step.column });
    }
  }

  // Convert to PhasePosition array, sorted by min column
  const positions: PhasePosition[] = [];

  for (const [phaseId, { min, max }] of phaseMap) {
    const x = flowStartX + min * COLUMN_GAP - 30; // 30px left padding
    const width = (max - min + 1) * COLUMN_GAP + 40; // 40px total padding for breathing room

    positions.push({
      phaseId,
      label: phaseLabels[phaseId] ?? phaseId,
      color: phaseColors[phaseId] ?? '#F1F5F9',
      x,
      width,
      minColumn: min,
      maxColumn: max,
    });
  }

  // Sort by min column
  positions.sort((a, b) => a.minColumn - b.minColumn);

  return positions;
}
