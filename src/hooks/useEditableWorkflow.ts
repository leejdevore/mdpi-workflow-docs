'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge as rfAddEdge,
} from '@xyflow/react';
import type { WorkflowStep, WorkflowEdge, ActorDefinition, PhaseDefinition } from '@/types/workflow';
import { useWorkflowData } from './useWorkflowData';
import { useUndoRedo } from './useUndoRedo';
import { shapeDimensions, PHASE_HEADER_HEIGHT, COLUMN_GAP } from '@/styles/flow-theme';
import { getActorForYFromActors, getActorYForActors } from '@/lib/swimlane-positions';
import { getPhasePositionsFromData } from '@/lib/phase-positions';
import type { PhaseHeaderData } from '@/components/flow/PhaseHeaderNode';

interface WorkflowSnapshot {
  nodes: Node[];
  edges: Edge[];
}

// =========================================================
// Helpers extracted from updateStep for readability
// =========================================================

/** Sync both old (actor/phase) and new (actorId/phaseId) field names */
function normalizeStepFields(
  data: Record<string, unknown>,
  updates: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...data, ...updates };
  const newActor = updates.actorId ?? updates.actor;
  const newPhase = updates.phaseId ?? updates.phase;
  if (newActor) {
    merged.actor = newActor;
    merged.actorId = newActor;
  }
  if (newPhase) {
    merged.phase = newPhase;
    merged.phaseId = newPhase;
  }
  return merged;
}

/** Build phase header nodes from the current set of process nodes */
function rebuildPhaseHeaders(
  processNodes: Node[],
  phases: PhaseDefinition[]
): Node[] {
  const stepLikeData: WorkflowStep[] = processNodes.map((n) => {
    const d = n.data as Record<string, unknown>;
    return {
      id: d.id as string,
      versionId: d.versionId as string,
      stepNumber: d.stepNumber as number | undefined,
      title: d.title as string,
      description: d.description as string,
      actorId: (d.actorId ?? d.actor) as string,
      phaseId: (d.phaseId ?? d.phase) as string,
      stepType: d.stepType as WorkflowStep['stepType'],
      column: d.column as number,
      shape: d.shape as WorkflowStep['shape'],
    } as WorkflowStep;
  });

  const phasePositions = getPhasePositionsFromData(stepLikeData, phases);

  return phasePositions.map((phase) => ({
    id: `phase-header-${phase.phaseId}`,
    type: 'phaseHeader' as const,
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
}

interface UseEditableWorkflowParams {
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
}

export function useEditableWorkflow(params: UseEditableWorkflowParams) {
  const { nodes: initialNodes, edges: initialEdges, lanePositions, phasePositions } = useWorkflowData(params);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const initialized = useRef(false);

  const {
    undo: undoSnapshot,
    redo: redoSnapshot,
    canUndo,
    canRedo,
    snapshot,
    setState: setSnapshot,
    reset: resetSnapshot,
  } = useUndoRedo<WorkflowSnapshot>({ nodes: initialNodes, edges: initialEdges });

  // Sync from data on change
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setNodes(initialNodes);
    setEdges(initialEdges);
    resetSnapshot({ nodes: initialNodes, edges: initialEdges });
  }, [initialNodes, initialEdges, setNodes, setEdges, resetSnapshot]);

  // Take snapshot before mutation
  const takeSnapshot = useCallback(() => {
    snapshot();
    setSnapshot({ nodes, edges });
  }, [snapshot, setSnapshot, nodes, edges]);

  const handleUndo = useCallback(() => {
    undoSnapshot();
  }, [undoSnapshot]);

  const handleRedo = useCallback(() => {
    redoSnapshot();
  }, [redoSnapshot]);

  // Node changes (drag, select, remove via React Flow)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const hasMeaningfulChange = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      );
      if (hasMeaningfulChange) {
        takeSnapshot();
      }
      onNodesChange(changes);

      // Detect lane crossing on drag-end and auto-update actor
      for (const c of changes) {
        if (c.type === 'position' && c.dragging === false && c.position) {
          const node = nodes.find((n) => n.id === c.id);
          if (!node || node.type === 'laneHeader') continue;

          const currentActor = (node.data as Record<string, unknown>).actorId as string
            ?? (node.data as Record<string, unknown>).actor as string;
          const newActor = getActorForYFromActors(c.position.y, params.actors);

          if (newActor && newActor !== currentActor) {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === c.id
                  ? { ...n, data: { ...n.data, actorId: newActor, actor: newActor } }
                  : n
              )
            );
          }
        }
      }
    },
    [onNodesChange, takeSnapshot, nodes, setNodes, params.actors]
  );

  // Edge changes from React Flow
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        takeSnapshot();
      }
      onEdgesChange(changes);
    },
    [onEdgesChange, takeSnapshot]
  );

  // Connect handler
  const handleConnect = useCallback(
    (connection: Connection) => {
      takeSnapshot();
      setEdges((eds) =>
        rfAddEdge(
          {
            ...connection,
            type: 'customEdge',
            style: { stroke: '#64748B', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, takeSnapshot]
  );

  // === Mutation helpers ===

  const addStep = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (step: WorkflowStep | Record<string, any>, position: { x: number; y: number }) => {
      takeSnapshot();
      const shape = step.shape as string | undefined;
      const dims = shape ? shapeDimensions[shape as keyof typeof shapeDimensions] ?? shapeDimensions.process : shapeDimensions.process;
      // Normalize: support both old (actor/phase) and new (actorId/phaseId) field names
      const actorValue = step.actorId ?? (step as Record<string, unknown>).actor ?? '';
      const phaseValue = step.phaseId ?? (step as Record<string, unknown>).phase ?? '';
      const newNode: Node = {
        id: step.id,
        type: 'processNode',
        position,
        data: { ...step, actor: actorValue, actorId: actorValue, phase: phaseValue, phaseId: phaseValue },
        style: { width: dims.width, height: dims.height },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, takeSnapshot]
  );

  const updateStep = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeId: string, updates: Partial<WorkflowStep> | Record<string, any>) => {
      takeSnapshot();

      const newActor = updates.actorId ?? (updates as Record<string, unknown>).actor;
      const newPhase = updates.phaseId ?? (updates as Record<string, unknown>).phase;

      setNodes((nds) => {
        // Update the target node's data, position, and dimensions
        const updatedNodes = nds.map((node) => {
          if (node.id !== nodeId) return node;

          const updatedData = normalizeStepFields(
            node.data as Record<string, unknown>,
            updates as Record<string, unknown>
          );

          const shape = updates.shape ?? (node.data as Record<string, unknown>).shape as string;
          const dims = shape ? shapeDimensions[shape as keyof typeof shapeDimensions] : shapeDimensions.process;

          let newPosition = node.position;
          if (newActor && newActor !== (node.data as Record<string, unknown>).actorId) {
            const newY = getActorYForActors(newActor as string, params.actors) + PHASE_HEADER_HEIGHT;
            newPosition = { ...newPosition, y: newY };
          }

          return {
            ...node,
            type: 'processNode',
            data: updatedData,
            position: newPosition,
            style: { width: dims?.width ?? 220, height: dims?.height ?? 100 },
          };
        });

        // Rebuild phase headers if phase changed
        if (newPhase) {
          const processNodes = updatedNodes.filter((n) => n.type === 'processNode');
          const nonPhaseNodes = updatedNodes.filter((n) => n.type !== 'phaseHeader');
          const phaseHeaderNodes = rebuildPhaseHeaders(processNodes, params.phases);
          return [...phaseHeaderNodes, ...nonPhaseNodes];
        }

        return updatedNodes;
      });
    },
    [setNodes, takeSnapshot, params.actors, params.phases]
  );

  const deleteStep = useCallback(
    (nodeId: string) => {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [setNodes, setEdges, takeSnapshot]
  );

  const addNewEdge = useCallback(
    (edgeParams: { source: string; target: string; label?: string }) => {
      takeSnapshot();
      const newEdge: Edge = {
        id: `edge-${edgeParams.source}-${edgeParams.target}-${Date.now()}`,
        source: edgeParams.source,
        target: edgeParams.target,
        label: edgeParams.label,
        type: 'customEdge',
        style: { stroke: '#64748B', strokeWidth: 2 },
      };
      setEdges((eds) => [...eds, newEdge]);
    },
    [setEdges, takeSnapshot]
  );

  const updateEdge = useCallback(
    (edgeId: string, updates: Partial<Edge>) => {
      takeSnapshot();
      setEdges((eds) =>
        eds.map((e) => (e.id === edgeId ? { ...e, ...updates } : e))
      );
    },
    [setEdges, takeSnapshot]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      takeSnapshot();
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [setEdges, takeSnapshot]
  );

  return {
    nodes,
    edges,
    lanePositions,
    phasePositions,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    setNodes,
    setEdges,
    addStep,
    updateStep,
    deleteStep,
    addEdge: addNewEdge,
    updateEdge,
    deleteEdge,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  };
}
