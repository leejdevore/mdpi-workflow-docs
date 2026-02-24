'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { WorkflowStep, WorkflowEdge, Scenario, ActorDefinition, PhaseDefinition } from '@/types/workflow';
import type { OverlayConfig } from '@/types/comparison';
import { fetchLatestVersion, fetchVersionData } from '@/lib/supabase/queries';
import { getLanePositionsForActors, getActorYForActors, getFlowStartX } from '@/lib/swimlane-positions';
import { getPhasePositionsFromData } from '@/lib/phase-positions';
import {
  COLUMN_GAP,
  NODE_WIDTH,
  NODE_HEIGHT,
  BRANCH_OFFSET_Y,
  LANE_HEIGHT,
  PHASE_HEADER_HEIGHT,
  shapeDimensions,
} from '@/styles/flow-theme';
import type { ProcessNodeData, LaneHeaderData } from '@/hooks/useWorkflowData';
import type { PhaseHeaderData } from '@/components/flow/PhaseHeaderNode';

export interface GhostNodeData extends Record<string, unknown> {
  ghostViewId: string;
  ghostViewLabel: string;
  ghostViewColor: string;
  id: string;
  title: string;
  description: string;
  actorId: string;
  phaseId: string;
  actor: string;
  phase: string;
  stepType: string;
  stepNumber?: number;
  column: number;
  shape?: string;
}

interface ScenarioCache {
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  name: string;
}

export function useOverlayData(
  config: OverlayConfig,
  scenarios: Scenario[],
  actors: ActorDefinition[],
  phases: PhaseDefinition[]
) {
  const [dataCache, setDataCache] = useState<Record<string, ScenarioCache>>({});
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef<Set<string>>(new Set());

  // Determine which scenario IDs we need data for
  const neededIds = useMemo(() => {
    const ids = [config.primaryView, ...config.ghostViews].filter(Boolean);
    return [...new Set(ids)];
  }, [config.primaryView, config.ghostViews]);

  // Fetch data for any scenarios not yet cached
  useEffect(() => {
    const missingIds = neededIds.filter(
      (id) => !dataCache[id] && !fetchingRef.current.has(id)
    );
    if (missingIds.length === 0) return;

    for (const id of missingIds) {
      fetchingRef.current.add(id);
    }

    setLoading(true);

    Promise.all(
      missingIds.map(async (scenarioId) => {
        const version = await fetchLatestVersion(scenarioId);
        if (!version) return { scenarioId, steps: [] as WorkflowStep[], edges: [] as WorkflowEdge[] };
        const data = await fetchVersionData(version.id);
        return { scenarioId, steps: data.steps, edges: data.edges };
      })
    )
      .then((results) => {
        setDataCache((prev) => {
          const next = { ...prev };
          for (const r of results) {
            const scenario = scenarios.find((s) => s.id === r.scenarioId);
            next[r.scenarioId] = {
              steps: r.steps,
              edges: r.edges,
              name: scenario?.name ?? '',
            };
            fetchingRef.current.delete(r.scenarioId);
          }
          return next;
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load overlay data:', err);
        for (const id of missingIds) {
          fetchingRef.current.delete(id);
        }
        setLoading(false);
      });
  }, [neededIds, scenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build nodes and edges from cached data
  return useMemo(() => {
    if (!config.primaryView) {
      return { nodes: [] as Node[], edges: [] as Edge[], lanePositions: [], phasePositions: [], loading: true };
    }

    const primaryData = dataCache[config.primaryView];
    if (!primaryData) {
      return { nodes: [] as Node[], edges: [] as Edge[], lanePositions: [], phasePositions: [], loading: true };
    }

    const flowStartX = getFlowStartX();
    const lanePositions = getLanePositionsForActors(actors);

    // Collect all steps across primary + ghosts for phase position calculation
    const allSteps = [
      ...primaryData.steps,
      ...config.ghostViews.flatMap((id) => dataCache[id]?.steps ?? []),
    ];
    const phasePositions = getPhasePositionsFromData(allSteps, phases);
    const yOffset = PHASE_HEADER_HEIGHT;

    // Phase header nodes
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

    // Lane header nodes
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

    // Scenario type → color mapping for ghost badges
    const scenarioTypeColors: Record<string, string> = {
      existing: '#EF4444',
      digitized: '#3B82F6',
      transformed: '#10B981',
      custom: '#8B5CF6',
    };

    // Ghost nodes and edges (rendered first = behind primary)
    const ghostNodes: Node[] = [];
    const ghostEdges: Edge[] = [];

    for (const ghostViewId of config.ghostViews) {
      const ghostData = dataCache[ghostViewId];
      if (!ghostData) continue;

      const ghostScenario = scenarios.find((s) => s.id === ghostViewId);
      const ghostColor = scenarioTypeColors[ghostScenario?.scenarioType ?? 'existing'] ?? '#94A3B8';

      for (const step of ghostData.steps) {
        let y = getActorYForActors(step.actorId, actors) + yOffset;
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
            actor: step.actorId,
            phase: step.phaseId,
            ghostViewId,
            ghostViewLabel: ghostData.name,
            ghostViewColor: ghostColor,
          } as GhostNodeData,
          style: { width: NODE_WIDTH, height: NODE_HEIGHT },
          selectable: false,
          draggable: false,
          connectable: false,
        });
      }

      for (const edge of ghostData.edges) {
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

    // Primary nodes and edges (rendered last = on top)
    const primaryNodes: Node[] = primaryData.steps.map((step) => {
      let y = getActorYForActors(step.actorId, actors) + yOffset;
      if (step.branch === 'ach') y += BRANCH_OFFSET_Y;

      const shapeKey = step.shape && step.shape !== 'process' ? step.shape : 'process';
      const dims = shapeDimensions[shapeKey] ?? { width: NODE_WIDTH, height: NODE_HEIGHT };

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

    const primaryEdges: Edge[] = primaryData.edges.map((edge) => ({
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
      nodes: [...phaseNodes, ...laneNodes, ...ghostNodes, ...primaryNodes],
      edges: [...ghostEdges, ...primaryEdges],
      lanePositions,
      phasePositions,
      loading,
    };
  }, [config, dataCache, actors, phases, loading]);
}
