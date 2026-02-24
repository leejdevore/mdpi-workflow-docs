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

import type { WorkflowStep as OldWorkflowStep } from '@/data/types';
import type { Scenario, ActorDefinition, PhaseDefinition } from '@/types/workflow';
import type { OverlayConfig } from '@/types/comparison';
import { useOverlayData } from '@/hooks/useOverlayData';
import { ProcessNode } from '@/components/flow/ProcessNode';
import { LaneHeaderNode } from '@/components/flow/LaneHeaderNode';
import { PhaseHeaderNode } from '@/components/flow/PhaseHeaderNode';
import { GhostProcessNode } from '@/components/flow/GhostProcessNode';
import { CustomEdge } from '@/components/flow/CustomEdge';
import { SwimlaneBackground } from '@/components/flow/SwimlaneBackground';
import { NodeDetailPanel } from '@/components/flow/NodeDetailPanel';
import { edgeTypes, sharedFlowProps } from '@/components/flow/SwimlaneDiagram';
import { COLUMN_GAP } from '@/styles/flow-theme';

const overlayNodeTypes: NodeTypes = {
  processNode: ProcessNode,
  laneHeader: LaneHeaderNode,
  phaseHeader: PhaseHeaderNode,
  ghostProcessNode: GhostProcessNode,
};

interface OverlayDiagramProps {
  config: OverlayConfig;
  scenarios: Scenario[];
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
}

function OverlayDiagramInner({ config, scenarios, actors, phases }: OverlayDiagramProps) {
  const { nodes, edges, lanePositions, phasePositions, loading } = useOverlayData(config, scenarios, actors, phases);
  const [selectedStep, setSelectedStep] = useState<OldWorkflowStep | null>(null);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode') {
      setSelectedStep(node.data as unknown as OldWorkflowStep);
    }
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedStep(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-slate-400">Loading overlay...</div>
      </div>
    );
  }

  const maxColumn = Math.max(
    ...nodes
      .filter((n) => n.type === 'processNode' || n.type === 'ghostProcessNode')
      .map((n) => (n.data as Record<string, unknown>).column as number ?? 0),
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
        <SwimlaneBackground lanePositions={lanePositions} phasePositions={phasePositions} totalWidth={totalWidth} />
        <Controls className="!bottom-4 !left-4" />
        <MiniMap
          className="!bottom-4 !right-4"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>

      {selectedStep && (
        <div className="pointer-events-none fixed right-0 top-0 h-full z-50">
          <div className="pointer-events-auto h-full">
            <NodeDetailPanel step={selectedStep} onClose={() => setSelectedStep(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

export function OverlayDiagram(props: OverlayDiagramProps) {
  return (
    <ReactFlowProvider key={`overlay-${props.config.primaryView}-${props.config.ghostViews.join(',')}`}>
      <OverlayDiagramInner {...props} />
    </ReactFlowProvider>
  );
}
