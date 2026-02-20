'use client';

import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { ViewId, WorkflowStep } from '@/data/types';
import { getWorkflowView } from '@/data';
import { getActorY, getFlowStartX, getLanePositions } from '@/lib/swimlane-positions';
import { COLUMN_GAP, NODE_WIDTH, NODE_HEIGHT, BRANCH_OFFSET_Y, LANE_HEIGHT } from '@/styles/flow-theme';

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

    // Create lane header nodes
    const laneNodes: Node[] = lanePositions.map((lane) => ({
      id: `lane-header-${lane.laneId}`,
      type: 'laneHeader',
      position: { x: 0, y: lane.y },
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

    // Create process nodes from workflow steps
    const processNodes: Node[] = view.steps.map((step) => {
      const baseY = getActorY(step.actor);
      let y = baseY;

      // Offset branches within their lane
      if (step.branch === 'ach') {
        y += BRANCH_OFFSET_Y;
      }

      return {
        id: step.id,
        type: 'processNode',
        position: {
          x: flowStartX + step.column * COLUMN_GAP,
          y,
        },
        data: { ...step } satisfies ProcessNodeData,
        style: { width: NODE_WIDTH, height: NODE_HEIGHT },
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
      nodes: [...laneNodes, ...processNodes],
      edges: flowEdges,
      lanePositions,
    };
  }, [viewId]);
}
