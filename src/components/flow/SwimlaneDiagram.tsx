'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ViewId, WorkflowStep, NodeShape } from '@/data/types';
import { useEditableWorkflow } from '@/hooks/useEditableWorkflow';
import { useEditMode } from '@/contexts/EditModeContext';
import { ProcessNode } from './ProcessNode';
import { ShapedNode } from './ShapedNode';
import { LaneHeaderNode } from './LaneHeaderNode';
import { CustomEdge } from './CustomEdge';
import { SwimlaneBackground } from './SwimlaneBackground';
import { NodeDetailPanel } from './NodeDetailPanel';
import { EditModeToggle } from './EditModeToggle';
import { ShapeToolbar } from '@/components/editing/ShapeToolbar';
import { CanvasClickHandler } from '@/components/editing/CanvasClickHandler';
import { COLUMN_GAP } from '@/styles/flow-theme';

export const nodeTypes: NodeTypes = {
  processNode: ProcessNode,
  shapedNode: ShapedNode,
  laneHeader: LaneHeaderNode,
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

export function SwimlaneDiagram({ viewId, className }: SwimlaneDiagramProps) {
  const {
    nodes,
    edges,
    lanePositions,
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
  } = useEditableWorkflow(viewId);

  const { isEditMode } = useEditMode();
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [armedShape, setArmedShape] = useState<NodeShape | null>(null);

  // Disarm shape when leaving edit mode
  useEffect(() => {
    if (!isEditMode) setArmedShape(null);
  }, [isEditMode]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode' || node.type === 'shapedNode') {
      setSelectedStep(node.data as unknown as WorkflowStep);
    }
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedStep(null);
  }, []);

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
        <SwimlaneBackground lanePositions={lanePositions} totalWidth={totalWidth} />
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

      {/* Detail panel overlay */}
      {selectedStep && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedStep(null)}
          />
          <NodeDetailPanel step={selectedStep} onClose={() => setSelectedStep(null)} />
        </>
      )}
    </div>
  );
}
