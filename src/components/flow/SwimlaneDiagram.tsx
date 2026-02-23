'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ViewId, WorkflowStep, NodeShape } from '@/data/types';
import { useEditableWorkflow } from '@/hooks/useEditableWorkflow';
import { useEditMode } from '@/contexts/EditModeContext';
import { ProcessNode } from './ProcessNode';
import { LaneHeaderNode } from './LaneHeaderNode';
import { PhaseHeaderNode } from './PhaseHeaderNode';
import { CustomEdge } from './CustomEdge';
import { SwimlaneBackground } from './SwimlaneBackground';
import { NodeDetailPanel } from './NodeDetailPanel';
import { NodeDetailEditPanel } from './NodeDetailEditPanel';
import { EditModeToggle } from './EditModeToggle';
import { ShapeToolbar } from '@/components/editing/ShapeToolbar';
import { CanvasClickHandler } from '@/components/editing/CanvasClickHandler';
import { EdgeEditPopover } from '@/components/editing/EdgeEditPopover';
import { DeleteConfirmDialog } from '@/components/editing/DeleteConfirmDialog';
import { COLUMN_GAP } from '@/styles/flow-theme';

export const nodeTypes: NodeTypes = {
  processNode: ProcessNode,
  laneHeader: LaneHeaderNode,
  phaseHeader: PhaseHeaderNode,
};

export const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

export const sharedFlowProps = {
  fitView: true,
  fitViewOptions: { padding: 0.1 },
  minZoom: 0.1,
  maxZoom: 2,
  panOnScroll: true,
  zoomOnScroll: true,
  nodesDraggable: false,
  nodesConnectable: false,
} as const;

interface SwimlaneDiagramProps {
  viewId: ViewId;
  className?: string;
}

interface DeleteTarget {
  id: string;
  name: string;
  connectedEdgeCount: number;
}

interface EditingEdge {
  edge: Edge;
  position: { x: number; y: number };
}

export function SwimlaneDiagram({ viewId, className }: SwimlaneDiagramProps) {
  const {
    nodes,
    edges,
    lanePositions,
    phasePositions,
    onNodesChange,
    onEdgesChange,
    onConnect,
    undo,
    redo,
    canUndo,
    canRedo,
    addStep,
    updateStep,
    deleteStep,
    updateEdge,
    deleteEdge,
  } = useEditableWorkflow(viewId);

  const { isEditMode } = useEditMode();
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [armedShape, setArmedShape] = useState<NodeShape | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingEdge, setEditingEdge] = useState<EditingEdge | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Close panels and disarm shape when leaving edit mode
  useEffect(() => {
    if (!isEditMode) {
      setArmedShape(null);
      setEditingEdge(null);
      setDeleteTarget(null);
    }
  }, [isEditMode]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode') {
      setSelectedStep(node.data as unknown as WorkflowStep);
      setSelectedNodeId(node.id);
    }
  }, []);

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!isEditMode) return;
      if (node.type === 'processNode') {
        setSelectedStep(node.data as unknown as WorkflowStep);
        setSelectedNodeId(node.id);
      }
    },
    [isEditMode]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (!isEditMode) return;
      setEditingEdge({
        edge,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [isEditMode]
  );

  const handlePaneClick = useCallback(() => {
    // Keep the panel open (sticky) — only close via panel's X button
    setEditingEdge(null);
  }, []);

  // Handle save from edit panel
  const handleEditSave = useCallback(
    (updates: Partial<WorkflowStep>) => {
      if (selectedNodeId) {
        updateStep(selectedNodeId, updates);
      }
    },
    [selectedNodeId, updateStep]
  );

  // Handle delete from edit panel
  const handleEditDelete = useCallback(() => {
    if (!selectedNodeId || !selectedStep) return;
    const connectedEdgeCount = edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    ).length;
    setDeleteTarget({
      id: selectedNodeId,
      name: selectedStep.title,
      connectedEdgeCount,
    });
  }, [selectedNodeId, selectedStep, edges]);

  // Confirm deletion
  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteStep(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedStep(null);
      setSelectedNodeId(null);
    }
  }, [deleteTarget, deleteStep]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    if (!isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, undo, redo]);

  // Estimate total width from the max column
  const maxColumn = Math.max(
    ...nodes.filter((n) => n.type === 'processNode').map((n) => (n.data as unknown as WorkflowStep).column ?? 0),
    0
  );
  const totalWidth = (maxColumn + 2) * COLUMN_GAP;

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      {/* Edit mode indicator ring */}
      {isEditMode && (
        <div className="absolute inset-0 border-2 border-amber-400 rounded-lg pointer-events-none z-10" />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onNodesChange={isEditMode ? onNodesChange : undefined}
        onEdgesChange={isEditMode ? onEdgesChange : undefined}
        onConnect={isEditMode ? onConnect : undefined}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        panOnScroll
        zoomOnScroll
        nodesDraggable={isEditMode}
        nodesConnectable={isEditMode}
        elementsSelectable={isEditMode}
        deleteKeyCode={isEditMode ? 'Backspace' : null}
        snapToGrid={isEditMode}
        snapGrid={[70, 25]}
      >
        <SwimlaneBackground lanePositions={lanePositions} phasePositions={phasePositions} totalWidth={totalWidth} />
        <Controls className="!bottom-4 !left-4" />
        <MiniMap
          className="!bottom-4 !right-4"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Shape toolbar */}
      <ShapeToolbar armedShape={armedShape} onArmShape={setArmedShape} />

      {/* Canvas click handler for placing shapes */}
      {armedShape && (
        <CanvasClickHandler
          armedShape={armedShape}
          onDisarm={() => setArmedShape(null)}
          onAddStep={addStep}
        />
      )}

      {/* Edit mode toggle */}
      <div className="absolute top-3 right-3 z-20">
        <EditModeToggle
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
      </div>

      {/* Edge edit popover */}
      {editingEdge && (
        <EdgeEditPopover
          edge={editingEdge.edge}
          position={editingEdge.position}
          onSave={updateEdge}
          onDelete={deleteEdge}
          onClose={() => setEditingEdge(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          name={deleteTarget.name}
          connectedEdgeCount={deleteTarget.connectedEdgeCount}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Detail panel — sticky, no backdrop, closes via X button only */}
      {selectedStep && (
        <div className="pointer-events-none fixed right-0 top-0 h-full z-50">
          <div className="pointer-events-auto h-full">
            {isEditMode ? (
              <NodeDetailEditPanel
                step={selectedStep}
                onSave={handleEditSave}
                onDelete={handleEditDelete}
                onClose={() => {
                  setSelectedStep(null);
                  setSelectedNodeId(null);
                }}
              />
            ) : (
              <NodeDetailPanel
                step={selectedStep}
                onClose={() => {
                  setSelectedStep(null);
                  setSelectedNodeId(null);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
