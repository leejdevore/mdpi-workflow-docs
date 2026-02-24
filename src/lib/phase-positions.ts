import type { WorkflowStep as OldStep, ProcessPhase } from '@/data/types';
import type { WorkflowStep, PhaseDefinition } from '@/types/workflow';
import { COLUMN_GAP, phaseColors, phaseLabels } from '@/styles/flow-theme';
import { getFlowStartX } from './swimlane-positions';

export interface PhasePosition {
  phaseId: string;
  label: string;
  color: string;
  x: number;
  width: number;
  minColumn: number;
  maxColumn: number;
}

/**
 * Compute phase header positions from old-style WorkflowStep[] (legacy).
 */
export function getPhasePositions(steps: OldStep[]): PhasePosition[] {
  if (steps.length === 0) return [];

  const flowStartX = getFlowStartX();
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

  const positions: PhasePosition[] = [];
  for (const [phaseId, { min, max }] of phaseMap) {
    const x = flowStartX + min * COLUMN_GAP - 30;
    const width = (max - min + 1) * COLUMN_GAP + 40;
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

  positions.sort((a, b) => a.minColumn - b.minColumn);
  return positions;
}

/**
 * Compute phase header positions from new WorkflowStep[] + PhaseDefinition[] (parameterized version).
 */
export function getPhasePositionsFromData(steps: WorkflowStep[], phases: PhaseDefinition[]): PhasePosition[] {
  if (steps.length === 0) return [];

  const flowStartX = getFlowStartX();

  // Build a map from phase ID to PhaseDefinition for labels/colors
  const phaseDefMap = new Map<string, PhaseDefinition>();
  for (const p of phases) {
    phaseDefMap.set(p.id, p);
  }

  // Group by phaseId, find min/max column
  const phaseMap = new Map<string, { min: number; max: number }>();

  for (const step of steps) {
    const existing = phaseMap.get(step.phaseId);
    if (existing) {
      existing.min = Math.min(existing.min, step.column);
      existing.max = Math.max(existing.max, step.column);
    } else {
      phaseMap.set(step.phaseId, { min: step.column, max: step.column });
    }
  }

  const positions: PhasePosition[] = [];
  for (const [phaseId, { min, max }] of phaseMap) {
    const def = phaseDefMap.get(phaseId);
    const x = flowStartX + min * COLUMN_GAP - 30;
    const width = (max - min + 1) * COLUMN_GAP + 40;
    positions.push({
      phaseId,
      label: def?.label ?? phaseLabels[phaseId] ?? phaseId,
      color: def?.color ?? phaseColors[phaseId] ?? '#F1F5F9',
      x,
      width,
      minColumn: min,
      maxColumn: max,
    });
  }

  positions.sort((a, b) => a.minColumn - b.minColumn);
  return positions;
}
