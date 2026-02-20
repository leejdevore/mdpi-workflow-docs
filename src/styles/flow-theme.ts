import type { StepType, NodeShape } from '@/data/types';

/** Node dimensions */
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 100;

/** Lane dimensions */
export const LANE_HEIGHT = 150;
export const LANE_HEADER_WIDTH = 200;
export const LANE_PADDING = 20;

/** Spacing */
export const COLUMN_GAP = 280;
export const BRANCH_OFFSET_Y = 60; // Vertical offset for parallel branches within a lane

/** Node colors by step type */
export const stepTypeColors: Record<StepType, { bg: string; border: string; text: string; badge: string }> = {
  manual: {
    bg: '#FFFBEB',
    border: '#F59E0B',
    text: '#92400E',
    badge: '#F59E0B',
  },
  automated: {
    bg: '#EFF6FF',
    border: '#3B82F6',
    text: '#1E40AF',
    badge: '#3B82F6',
  },
  'data-driven': {
    bg: '#F0FDF4',
    border: '#22C55E',
    text: '#166534',
    badge: '#22C55E',
  },
  hybrid: {
    bg: '#FAF5FF',
    border: '#A855F7',
    text: '#6B21A8',
    badge: '#A855F7',
  },
};

/** Impact score color scale (1-5) */
export function getImpactColor(score: number): string {
  if (score <= 2) return '#22C55E'; // green
  if (score <= 3) return '#EAB308'; // yellow
  if (score <= 4) return '#F97316'; // orange
  return '#EF4444'; // red
}

/** Impact score background (lighter) */
export function getImpactBgColor(score: number): string {
  if (score <= 2) return '#DCFCE7'; // green-100
  if (score <= 3) return '#FEF9C3'; // yellow-100
  if (score <= 4) return '#FFEDD5'; // orange-100
  return '#FEE2E2'; // red-100
}

/** Total change impact score color (3-15 scale) */
export function getTotalImpactColor(total: number): string {
  if (total <= 6) return '#22C55E';
  if (total <= 9) return '#EAB308';
  if (total <= 12) return '#F97316';
  return '#EF4444';
}

/** Ghost overlay styling */
export const GHOST_OPACITY = 0.2;
export const GHOST_SATURATION = 0.1;

/** View identity colors (for labels and badges) */
export const viewColors: Record<string, string> = {
  current: '#F59E0B',    // amber
  digitized: '#3B82F6',  // blue
  transformed: '#22C55E', // green
};

/** Shape dimensions for each node shape */
export const shapeDimensions: Record<NodeShape, { width: number; height: number }> = {
  process: { width: 220, height: 100 },
  decision: { width: 200, height: 120 },
  'start-end': { width: 180, height: 80 },
  document: { width: 220, height: 110 },
  data: { width: 220, height: 100 },
  'manual-operation': { width: 220, height: 100 },
  subprocess: { width: 220, height: 100 },
  validation: { width: 200, height: 110 },
};

/** Phase colors for visual grouping */
export const phaseColors: Record<string, string> = {
  'pre-draw': '#F1F5F9',
  'invoice-receipt': '#FEF3C7',
  'invoice-processing': '#FEF9C3',
  'invoice-tabulation': '#DBEAFE',
  'draw-assembly': '#E0E7FF',
  'post-approval': '#D1FAE5',
  'payment-check': '#FEE2E2',
  'payment-ach': '#DCFCE7',
};
