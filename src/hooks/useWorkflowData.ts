'use client';

import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { ViewId, WorkflowStep } from '@/data/types';
import { getWorkflowView } from '@/data';
import { getActorY, getFlowStartX, getLanePositions } from '@/lib/swimlane-positions';
import { getPhasePositions, type PhasePosition } from '@/lib/phase-positions';
import { COLUMN_GAP, NODE_WIDTH, NODE_HEIGHT, BRANCH_OFFSET_Y, LANE_HEIGHT, PHASE_HEADER_HEIGHT, shapeDimensions } from '@/styles/flow-theme';
import type { PhaseHeaderData } from '@/components/flow/PhaseHeaderNode';

export interface ProcessNodeData extends WorkflowStep {
  [key: string]: unknown;
}

export interface LaneHeaderData {
  label: string;
  shortLabel: string;
  color: string;
  [key: string]: unknown;
}

export function useWorkflowData(viewId: ViewId) {
  return useMemo(() => {
    const view = getWorkflowView(viewId);
    const flowStartX = getFlowStartX();
    const lanePositions = getLanePositions();
    const phasePositions = getPhasePositions(view.steps);

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
    const processNodes: Node[] = view.steps.map((step) => {
      const baseY = getActorY(step.actor);
      let y = baseY + yOffset;

      // Offset branches within their lane
      if (step.branch === 'ach') {
        y += BRANCH_OFFSET_Y;
      }

      const dims = step.shape && step.shape !== 'process' ? shapeDimensions[step.shape] : { width: NODE_WIDTH, height: NODE_HEIGHT };

      return {
        id: step.id,
        type: 'processNode',
        position: {
          x: flowStartX + step.column * COLUMN_GAP,
          y,
        },
        data: { ...step } satisfies ProcessNodeData,
        style: { width: dims.width, height: dims.height },
      };
    });

    // Create edges
    const flowEdges: Edge[] = view.edges.map((edge) => ({
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
  }, [viewId]);
}
