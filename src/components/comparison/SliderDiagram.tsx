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

import type { ViewId, WorkflowStep } from '@/data/types';
import type { SliderConfig } from '@/types/comparison';
import { useWorkflowData } from '@/hooks/useWorkflowData';
import { useViewportSync } from '@/hooks/useViewportSync';
import { nodeTypes, edgeTypes, sharedFlowProps } from '@/components/flow/SwimlaneDiagram';
import { SwimlaneBackground } from '@/components/flow/SwimlaneBackground';
import { NodeDetailPanel } from '@/components/flow/NodeDetailPanel';
import { COLUMN_GAP } from '@/styles/flow-theme';
import { viewColors } from '@/styles/flow-theme';

const viewLabels: Record<ViewId, string> = {
  current: 'Current State',
  digitized: 'Digitized',
  transformed: 'Digitally Transformed',
};

interface SliderDiagramProps {
  config: SliderConfig;
  onDividerChange: (position: number) => void;
}

function SliderSide({
  viewId,
  side,
  viewport,
  onViewportChange,
  showControls,
  onNodeClick,
  onPaneClick,
  shouldFitView,
  onFitViewDone,
}: {
  viewId: ViewId;
  side: 'left' | 'right';
  viewport: { x: number; y: number; zoom: number };
  onViewportChange: (vp: { x: number; y: number; zoom: number }) => void;
  showControls: boolean;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  shouldFitView: boolean;
  onFitViewDone: () => void;
}) {
  const { nodes, edges, lanePositions } = useWorkflowData(viewId);
  const { fitView } = useReactFlow();

  // Fit the view on initial mount for the left side
  useEffect(() => {
    if (shouldFitView) {
      // Small delay to let React Flow measure the container
      const timer = setTimeout(() => {
        fitView({ padding: 0.1 });
        onFitViewDone();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFitView, fitView, onFitViewDone]);

  const maxColumn = Math.max(
    ...nodes.filter((n) => n.type === 'processNode').map((n) => (n.data as unknown as WorkflowStep).column ?? 0),
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
      <SwimlaneBackground lanePositions={lanePositions} totalWidth={totalWidth} />
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
      {/* Visible line */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-500 -translate-x-1/2" />

      {/* Drag handle */}
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

export function SliderDiagram({ config, onDividerChange }: SliderDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewport, handleLeftChange, handleRightChange } = useViewportSync();
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [needsFitView, setNeedsFitView] = useState(true);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'processNode') {
      setSelectedStep(node.data as unknown as WorkflowStep);
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

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Left view */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - config.dividerPosition}% 0 0)` }}
      >
        <ReactFlowProvider key={`slider-left-${config.leftView}`}>
          <SliderSide
            viewId={config.leftView}
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
            viewId={config.rightView}
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
        label={viewLabels[config.leftView]}
        color={viewColors[config.leftView]}
      />
      <ViewLabel
        side="right"
        label={viewLabels[config.rightView]}
        color={viewColors[config.rightView]}
      />

      {/* Detail panel */}
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
