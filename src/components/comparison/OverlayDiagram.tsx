'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  type NodeTypes,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { WorkflowStep } from '@/data/types';
import type { OverlayConfig } from '@/types/comparison';
import { useOverlayData } from '@/hooks/useOverlayData';
import { ProcessNode } from '@/components/flow/ProcessNode';
import { LaneHeaderNode } from '@/components/flow/LaneHeaderNode';
import { GhostProcessNode } from '@/components/flow/GhostProcessNode';
import { CustomEdge } from '@/components/flow/CustomEdge';
import { SwimlaneBackground } from '@/components/flow/SwimlaneBackground';
import { NodeDetailPanel } from '@/components/flow/NodeDetailPanel';
import { edgeTypes, sharedFlowProps } from '@/components/flow/SwimlaneDiagram';
import { COLUMN_GAP } from '@/styles/flow-theme';

const overlayNodeTypes: NodeTypes = {
  processNode: ProcessNode,
  laneHeader: LaneHeaderNode,
  ghostProcessNode: GhostProcessNode,
};

interface OverlayDiagramProps {
  config: OverlayConfig;
}

function OverlayDiagramInner({ config }: OverlayDiagramProps) {
  const { nodes, edges, lanePositions } = useOverlayData(config);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode') {
      setSelectedStep(node.data as unknown as WorkflowStep);
    }
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedStep(null);
  }, []);

  const maxColumn = Math.max(
    ...nodes.filter((n) => n.type === 'processNode' || n.type === 'ghostProcessNode').map((n) => (n.data as unknown as WorkflowStep).column ?? 0),
    0
  );
  const totalWidth = (maxColumn + 2) * COLUMN_GAP;

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={overlayNodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        {...sharedFlowProps}
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

export function OverlayDiagram({ config }: OverlayDiagramProps) {
  return (
    <ReactFlowProvider key={`overlay-${config.primaryView}-${config.ghostViews.join(',')}`}>
      <OverlayDiagramInner config={config} />
    </ReactFlowProvider>
  );
}
