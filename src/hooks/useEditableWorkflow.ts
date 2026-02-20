'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge as rfAddEdge,
} from '@xyflow/react';
import type { ViewId, WorkflowStep } from '@/data/types';
import { useWorkflowData } from './useWorkflowData';
import { useUndoRedo } from './useUndoRedo';

interface WorkflowSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export function useEditableWorkflow(viewId: ViewId) {
  const { nodes: initialNodes, edges: initialEdges, lanePositions } = useWorkflowData(viewId);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const initialized = useRef(false);

  const {
    state: _snapshot,
    undo: undoSnapshot,
    redo: redoSnapshot,
    canUndo,
    canRedo,
    snapshot,
    setState: setSnapshot,
    reset: resetSnapshot,
  } = useUndoRedo<WorkflowSnapshot>({ nodes: initialNodes, edges: initialEdges });

  // Sync from static data on viewId change
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setNodes(initialNodes);
    setEdges(initialEdges);
    resetSnapshot({ nodes: initialNodes, edges: initialEdges });
  }, [viewId, initialNodes, initialEdges, setNodes, setEdges, resetSnapshot]);

  // Take snapshot before mutation
  const takeSnapshot = useCallback(() => {
    snapshot();
    setSnapshot({ nodes, edges });
  }, [snapshot, setSnapshot, nodes, edges]);

  // Undo: restore previous snapshot
  const undo = useCallback(() => {
    // Save current to future
    snapshot();
    undoSnapshot();
  }, [snapshot, undoSnapshot]);

  // We need a custom undo/redo that restores nodes and edges
  const handleUndo = useCallback(() => {
    undoSnapshot();
  }, [undoSnapshot]);

  const handleRedo = useCallback(() => {
    redoSnapshot();
  }, [redoSnapshot]);

  // When undo/redo fires, the snapshot state changes. We need to sync nodes/edges from it.
  // Actually, let's simplify: use the undo/redo to store full snapshots and sync back.
  // We'll restructure: undo/redo manages snapshots, and we sync nodes/edges from them.

  // Simpler approach: wrap mutations with snapshot + direct state changes
  const withSnapshot = useCallback(
    (fn: () => void) => {
      snapshot();
      setSnapshot({ nodes, edges });
      fn();
    },
    [snapshot, setSnapshot, nodes, edges]
  );

  // Node changes (drag, select, remove via React Flow)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Only snapshot for position changes (drag), not select/dimensions
      const hasMeaningfulChange = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      );
      if (hasMeaningfulChange) {
        takeSnapshot();
      }
      onNodesChange(changes);
    },
    [onNodesChange, takeSnapshot]
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
    (step: WorkflowStep, position: { x: number; y: number }) => {
      takeSnapshot();
      const newNode: Node = {
        id: step.id,
        type: 'processNode',
        position,
        data: { ...step },
        style: { width: 220, height: 100 },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, takeSnapshot]
  );

  const updateStep = useCallback(
    (nodeId: string, updates: Partial<WorkflowStep>) => {
      takeSnapshot();
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    [setNodes, takeSnapshot]
  );

  const deleteStep = useCallback(
    (nodeId: string) => {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      // Remove connected edges
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [setNodes, setEdges, takeSnapshot]
  );

  const addNewEdge = useCallback(
    (params: { source: string; target: string; label?: string }) => {
      takeSnapshot();
      const newEdge: Edge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        label: params.label,
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
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    setNodes,
    setEdges,
    // Mutations
    addStep,
    updateStep,
    deleteStep,
    addEdge: addNewEdge,
    updateEdge,
    deleteEdge,
    // Undo/redo
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  };
}
