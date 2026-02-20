'use client';

import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { WorkflowStep } from '@/data/types';
import type { OverlayConfig } from '@/types/comparison';
import { getWorkflowView } from '@/data';
import { getActorY, getFlowStartX, getLanePositions } from '@/lib/swimlane-positions';
import {
  COLUMN_GAP,
  NODE_WIDTH,
  NODE_HEIGHT,
  BRANCH_OFFSET_Y,
  LANE_HEIGHT,
} from '@/styles/flow-theme';
import type { ProcessNodeData, LaneHeaderData } from '@/hooks/useWorkflowData';

export interface GhostNodeData extends WorkflowStep {
  ghostViewId: string;
  ghostViewLabel: string;
  [key: string]: unknown;
}

export function useOverlayData(config: OverlayConfig) {
  return useMemo(() => {
    const primaryView = getWorkflowView(config.primaryView);
    const flowStartX = getFlowStartX();
    const lanePositions = getLanePositions();

    // Lane header nodes (shared, only once)
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

    // Ghost view nodes and edges (rendered first = behind primary)
    const ghostNodes: Node[] = [];
    const ghostEdges: Edge[] = [];

    for (const ghostViewId of config.ghostViews) {
      const ghostView = getWorkflowView(ghostViewId);

      for (const step of ghostView.steps) {
        let y = getActorY(step.actor);
        if (step.branch === 'ach') y += BRANCH_OFFSET_Y;

        ghostNodes.push({
          id: `ghost-${ghostViewId}-${step.id}`,
          type: 'ghostProcessNode',
          position: {
            x: flowStartX + step.column * COLUMN_GAP,
            y,
          },
          data: {
            ...step,
            ghostViewId,
            ghostViewLabel: ghostView.label,
          } satisfies GhostNodeData,
          style: { width: NODE_WIDTH, height: NODE_HEIGHT },
          selectable: false,
          draggable: false,
          connectable: false,
        });
      }

      for (const edge of ghostView.edges) {
        ghostEdges.push({
          id: `ghost-${ghostViewId}-${edge.id}`,
          source: `ghost-${ghostViewId}-${edge.sourceStepId}`,
          target: `ghost-${ghostViewId}-${edge.targetStepId}`,
          label: edge.label,
          type: 'customEdge',
          animated: edge.animated ?? false,
          style: {
            stroke: edge.edgeType === 'conditional' ? '#F59E0B' : '#64748B',
            strokeWidth: 1.5,
            opacity: 0.15,
          },
          labelStyle: {
            fontSize: 11,
            fontWeight: 500,
            fill: '#475569',
            opacity: 0.15,
          },
          labelBgStyle: {
            fill: '#F8FAFC',
            fillOpacity: 0.1,
          },
        });
      }
    }

    // Primary view nodes and edges (rendered last = on top)
    const primaryNodes: Node[] = primaryView.steps.map((step) => {
      let y = getActorY(step.actor);
      if (step.branch === 'ach') y += BRANCH_OFFSET_Y;

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

    const primaryEdges: Edge[] = primaryView.edges.map((edge) => ({
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
      nodes: [...laneNodes, ...ghostNodes, ...primaryNodes],
      edges: [...ghostEdges, ...primaryEdges],
      lanePositions,
    };
  }, [config.primaryView, config.ghostViews]);
}
