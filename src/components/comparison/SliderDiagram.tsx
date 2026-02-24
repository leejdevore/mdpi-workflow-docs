'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Scenario, ActorDefinition, PhaseDefinition, UUID } from '@/types/workflow';
import type { ProcessNodeData } from '@/hooks/useWorkflowData';
import type { SliderConfig } from '@/types/comparison';
import { useScenarioData } from '@/hooks/useScenarioData';
import { useWorkflowData } from '@/hooks/useWorkflowData';
import { useViewportSync } from '@/hooks/useViewportSync';
import { nodeTypes, edgeTypes, sharedFlowProps } from '@/components/flow/SwimlaneDiagram';
import { SwimlaneBackground } from '@/components/flow/SwimlaneBackground';
import { NodeDetailPanel } from '@/components/flow/NodeDetailPanel';
import { COLUMN_GAP } from '@/styles/flow-theme';

const scenarioTypeColors: Record<string, string> = {
  existing: '#EF4444',
  digitized: '#3B82F6',
  transformed: '#10B981',
  custom: '#8B5CF6',
};

interface SliderDiagramProps {
  config: SliderConfig;
  scenarios: Scenario[];
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
  onDividerChange: (position: number) => void;
}

function SliderSide({
  scenarioId,
  actors,
  phases,
  side,
  viewport,
  onViewportChange,
  showControls,
  onNodeClick,
  onPaneClick,
  shouldFitView,
  onFitViewDone,
}: {
  scenarioId: UUID;
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
  side: 'left' | 'right';
  viewport: { x: number; y: number; zoom: number };
  onViewportChange: (vp: { x: number; y: number; zoom: number }) => void;
  showControls: boolean;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  shouldFitView: boolean;
  onFitViewDone: () => void;
}) {
  const { steps, edges: scenarioEdges } = useScenarioData(scenarioId);
  const { nodes, edges, lanePositions, phasePositions } = useWorkflowData({ steps, edges: scenarioEdges, actors, phases });
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (shouldFitView && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1 });
        onFitViewDone();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFitView, fitView, onFitViewDone, nodes.length]);

  const maxColumn = Math.max(
    ...nodes.filter((n) => n.type === 'processNode').map((n) => (n.data as Record<string, unknown>).column as number ?? 0),
    0
  );
  const totalWidth = (maxColumn + 2) * COLUMN_GAP;

  const { fitView: _fitView, fitViewOptions: _fitViewOptions, ...controlledProps } = sharedFlowProps;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      viewport={viewport}
      onViewportChange={onViewportChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      {...controlledProps}
    >
      <SwimlaneBackground lanePositions={lanePositions} phasePositions={phasePositions} totalWidth={totalWidth} />
      {showControls && (
        <>
          <Controls className="!bottom-4 !left-4" />
          <MiniMap
            className="!bottom-4 !right-4"
            nodeStrokeWidth={3}
            pannable
            zoomable
          />
        </>
      )}
    </ReactFlow>
  );
}

function SliderDivider({
  position,
  onChange,
  containerRef,
}: {
  position: number;
  onChange: (pos: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isDragging = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.classList.add('slider-dragging');
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(90, Math.max(10, (x / rect.width) * 100));
      onChange(pct);
    },
    [onChange, containerRef]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    document.body.classList.remove('slider-dragging');
  }, []);

  return (
    <div
      className="absolute top-0 bottom-0 z-30"
      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
    >
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-500 -translate-x-1/2" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center cursor-col-resize touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="w-4 h-8 bg-white border border-slate-300 rounded-md shadow flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-slate-300 rounded-full" />
            <div className="w-0.5 h-4 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewLabel({ side, label, color }: { side: 'left' | 'right'; label: string; color: string }) {
  return (
    <div
      className={`absolute top-3 z-20 px-3 py-1.5 rounded-md shadow-sm border border-slate-200 bg-white/90 backdrop-blur-sm ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-slate-700">{label}</span>
      </div>
    </div>
  );
}

export function SliderDiagram({ config, scenarios, actors, phases, onDividerChange }: SliderDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewport, handleLeftChange, handleRightChange } = useViewportSync();
  const [selectedStep, setSelectedStep] = useState<ProcessNodeData | null>(null);
  const [needsFitView, setNeedsFitView] = useState(true);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode') {
      setSelectedStep(node.data as unknown as ProcessNodeData);
    }
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedStep(null);
  }, []);

  const handleLeftViewportChange = useCallback(
    (vp: { x: number; y: number; zoom: number }) => {
      handleLeftChange(vp);
    },
    [handleLeftChange]
  );

  const handleFitViewDone = useCallback(() => {
    setNeedsFitView(false);
  }, []);

  const leftScenario = scenarios.find((s) => s.id === config.leftView);
  const rightScenario = scenarios.find((s) => s.id === config.rightView);
  const leftColor = scenarioTypeColors[leftScenario?.scenarioType ?? 'existing'] ?? '#64748B';
  const rightColor = scenarioTypeColors[rightScenario?.scenarioType ?? 'existing'] ?? '#64748B';

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Left view */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - config.dividerPosition}% 0 0)` }}
      >
        <ReactFlowProvider key={`slider-left-${config.leftView}`}>
          <SliderSide
            scenarioId={config.leftView}
            actors={actors}
            phases={phases}
            side="left"
            viewport={viewport}
            onViewportChange={handleLeftViewportChange}
            showControls={true}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            shouldFitView={needsFitView}
            onFitViewDone={handleFitViewDone}
          />
        </ReactFlowProvider>
      </div>

      {/* Right view */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${config.dividerPosition}%)` }}
      >
        <ReactFlowProvider key={`slider-right-${config.rightView}`}>
          <SliderSide
            scenarioId={config.rightView}
            actors={actors}
            phases={phases}
            side="right"
            viewport={viewport}
            onViewportChange={handleRightChange}
            showControls={false}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            shouldFitView={false}
            onFitViewDone={handleFitViewDone}
          />
        </ReactFlowProvider>
      </div>

      {/* Divider */}
      <SliderDivider
        position={config.dividerPosition}
        onChange={onDividerChange}
        containerRef={containerRef}
      />

      {/* View labels */}
      <ViewLabel
        side="left"
        label={leftScenario?.name ?? 'Left'}
        color={leftColor}
      />
      <ViewLabel
        side="right"
        label={rightScenario?.name ?? 'Right'}
        color={rightColor}
      />

      {/* Detail panel */}
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
