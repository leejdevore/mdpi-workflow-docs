'use client';

import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { WorkflowStep, WorkflowEdge, ActorDefinition, PhaseDefinition, StepType, NodeShape } from '@/types/workflow';
import { getLanePositionsForActors, getActorYForActors, getFlowStartX } from '@/lib/swimlane-positions';
import { getPhasePositionsFromData } from '@/lib/phase-positions';
import { COLUMN_GAP, NODE_WIDTH, NODE_HEIGHT, BRANCH_OFFSET_Y, LANE_HEIGHT, PHASE_HEADER_HEIGHT, shapeDimensions } from '@/styles/flow-theme';
import type { PhaseHeaderData } from '@/components/flow/PhaseHeaderNode';

export interface ProcessNodeData {
  id: string;
  versionId: string;
  stepNumber?: number;
  title: string;
  description: string;
  actorId: string;
  phaseId: string;
  stepType: StepType;
  documents?: string[];
  painPoints?: string[];
  improvements?: string[];
  toolsUsed?: string[];
  column: number;
  branch?: string;
  subItems?: string[];
  shape?: NodeShape;
  impact?: { consistency: number; cost: number; control: number };
  positionX?: number;
  positionY?: number;
  // Old field names for backward compat with ProcessNode rendering
  actor: string;
  phase: string;
  [key: string]: unknown;
}

export interface LaneHeaderData {
  label: string;
  shortLabel: string;
  color: string;
  [key: string]: unknown;
}

interface UseWorkflowLayoutParams {
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
}

export function useWorkflowData(params: UseWorkflowLayoutParams) {
  const { steps, edges, actors, phases } = params;

  return useMemo(() => {
    const flowStartX = getFlowStartX();
    const lanePositions = getLanePositionsForActors(actors);
    const phasePositions = getPhasePositionsFromData(steps, phases);

    // Vertical offset: everything shifts down to make room for phase headers
    const yOffset = PHASE_HEADER_HEIGHT;

    // Create phase header nodes (positioned above the lanes)
    const phaseNodes: Node[] = phasePositions.map((phase) => ({
      id: `phase-header-${phase.phaseId}`,
      type: 'phaseHeader',
      position: { x: phase.x, y: 0 },
      data: {
        label: phase.label,
        color: phase.color,
        phaseWidth: phase.width,
      } satisfies PhaseHeaderData,
      draggable: false,
      selectable: false,
      connectable: false,
      style: { width: phase.width, height: PHASE_HEADER_HEIGHT },
    }));

    // Create lane header nodes (shifted down by yOffset)
    const laneNodes: Node[] = lanePositions.map((lane) => ({
      id: `lane-header-${lane.laneId}`,
      type: 'laneHeader',
      position: { x: 0, y: lane.y + yOffset },
      data: {
        label: lane.label,
        shortLabel: lane.shortLabel,
        color: lane.color,
      } satisfies LaneHeaderData,
      draggable: false,
      selectable: false,
      connectable: false,
      style: { width: 180, height: LANE_HEIGHT },
    }));

    // Create process nodes from workflow steps (shifted down by yOffset)
    const processNodes: Node[] = steps.map((step) => {
      const baseY = getActorYForActors(step.actorId, actors);
      let y = baseY + yOffset;

      // Offset branches within their lane
      if (step.branch === 'ach') {
        y += BRANCH_OFFSET_Y;
      }

      const shapeKey = step.shape && step.shape !== 'process' ? step.shape : 'process';
      const dims = shapeDimensions[shapeKey] ?? { width: NODE_WIDTH, height: NODE_HEIGHT };

      // Build data with both new and old field names for ProcessNode compatibility
      const data: ProcessNodeData = {
        ...step,
        actor: step.actorId,
        phase: step.phaseId,
      };

      return {
        id: step.id,
        type: 'processNode',
        position: {
          x: flowStartX + step.column * COLUMN_GAP,
          y,
        },
        data,
        style: { width: dims.width, height: dims.height },
      };
    });

    // Create edges
    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceStepId,
      target: edge.targetStepId,
      label: edge.label,
      type: 'customEdge',
      animated: edge.animated ?? false,
      style: {
        stroke: edge.edgeType === 'conditional' ? '#F59E0B' : '#64748B',
        strokeWidth: 2,
      },
      labelStyle: {
        fontSize: 11,
        fontWeight: 500,
        fill: '#475569',
      },
      labelBgStyle: {
        fill: '#F8FAFC',
        fillOpacity: 0.9,
      },
    }));

    return {
      nodes: [...phaseNodes, ...laneNodes, ...processNodes],
      edges: flowEdges,
      lanePositions,
      phasePositions,
    };
  }, [steps, edges, actors, phases]);
}
