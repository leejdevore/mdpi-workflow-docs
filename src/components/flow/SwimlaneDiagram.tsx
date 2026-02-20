'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ViewId, WorkflowStep } from '@/data/types';
import { useWorkflowData } from '@/hooks/useWorkflowData';
import { ProcessNode } from './ProcessNode';
import { LaneHeaderNode } from './LaneHeaderNode';
import { CustomEdge } from './CustomEdge';
import { SwimlaneBackground } from './SwimlaneBackground';
import { NodeDetailPanel } from './NodeDetailPanel';
import { COLUMN_GAP } from '@/styles/flow-theme';

const nodeTypes: NodeTypes = {
  processNode: ProcessNode,
  laneHeader: LaneHeaderNode,
};

const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

interface SwimlaneDiagramProps {
  viewId: ViewId;
  className?: string;
}

export function SwimlaneDiagram({ viewId, className }: SwimlaneDiagramProps) {
  const { nodes, edges, lanePositions } = useWorkflowData(viewId);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode') {
      setSelectedStep(node.data as unknown as WorkflowStep);
    }
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedStep(null);
  }, []);

  // Estimate total width from the max column
  const maxColumn = Math.max(...nodes.filter(n => n.type === 'processNode').map(n => (n.data as unknown as WorkflowStep).column ?? 0), 0);
  const totalWidth = (maxColumn + 2) * COLUMN_GAP;

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        panOnScroll
        zoomOnScroll
        nodesDraggable={false}
        nodesConnectable={false}
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
