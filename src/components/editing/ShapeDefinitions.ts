import type { NodeShape, StepType } from '@/types/workflow';

export interface ShapeDefinition {
  id: NodeShape;
  label: string;
  defaultStepType: StepType;
  width: number;
  height: number;
  group: 'basic' | 'specialized';
  /** SVG path for toolbar icon preview (viewBox: 0 0 40 30) */
  iconPath: string;
}

export const shapeDefinitions: Record<NodeShape, ShapeDefinition> = {
  process: {
    id: 'process',
    label: 'Process',
    defaultStepType: 'manual',
    width: 220,
    height: 100,
    group: 'basic',
    iconPath: 'M2 4h36v22H2z',
  },
  decision: {
    id: 'decision',
    label: 'Decision',
    defaultStepType: 'manual',
    width: 200,
    height: 120,
    group: 'basic',
    iconPath: 'M20 2L38 15L20 28L2 15Z',
  },
  'start-end': {
    id: 'start-end',
    label: 'Start / End',
    defaultStepType: 'manual',
    width: 180,
    height: 80,
    group: 'basic',
    iconPath: 'M10 4h20a10 11 0 0 1 0 22H10a10 11 0 0 1 0-22z',
  },
  document: {
    id: 'document',
    label: 'Document',
    defaultStepType: 'manual',
    width: 220,
    height: 110,
    group: 'specialized',
    iconPath: 'M2 4h36v18c-6-4-12 4-18 0s-12 4-18 0z',
  },
  data: {
    id: 'data',
    label: 'Data',
    defaultStepType: 'data-driven',
    width: 220,
    height: 100,
    group: 'specialized',
    iconPath: 'M8 4L38 4L30 26L0 26Z',
  },
  'manual-operation': {
    id: 'manual-operation',
    label: 'Manual Op',
    defaultStepType: 'manual',
    width: 220,
    height: 100,
    group: 'specialized',
    iconPath: 'M5 4h30L32 26H8Z',
  },
  subprocess: {
    id: 'subprocess',
    label: 'Subprocess',
    defaultStepType: 'automated',
    width: 220,
    height: 100,
    group: 'specialized',
    iconPath: 'M2 4h36v22H2zM6 4v22M34 4v22',
  },
  validation: {
    id: 'validation',
    label: 'Validation',
    defaultStepType: 'hybrid',
    width: 200,
    height: 110,
    group: 'specialized',
    iconPath: 'M20 2L36 10L36 22L20 28L4 22L4 10Z',
  },
};

export const basicShapes = Object.values(shapeDefinitions).filter((s) => s.group === 'basic');
export const specializedShapes = Object.values(shapeDefinitions).filter((s) => s.group === 'specialized');
