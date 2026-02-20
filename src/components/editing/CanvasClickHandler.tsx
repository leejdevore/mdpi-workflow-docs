'use client';

import { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { NodeShape, WorkflowStep, ActorId } from '@/data/types';
import { useEditMode } from '@/contexts/EditModeContext';
import { shapeDefinitions } from './ShapeDefinitions';

interface CanvasClickHandlerProps {
  armedShape: NodeShape | null;
  onDisarm: () => void;
  onAddStep: (step: WorkflowStep, position: { x: number; y: number }) => void;
}

export function CanvasClickHandler({ armedShape, onDisarm, onAddStep }: CanvasClickHandlerProps) {
  const { isEditMode } = useEditMode();
  const { screenToFlowPosition } = useReactFlow();
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  // Track mouse for ghost preview
  useEffect(() => {
    if (!armedShape || !isEditMode) {
      setGhostPos(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDisarm();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [armedShape, isEditMode, onDisarm]);

  // Set cursor style on ReactFlow pane
  useEffect(() => {
    const pane = document.querySelector('.react-flow');
    if (armedShape && isEditMode) {
      pane?.classList.add('shape-armed');
    } else {
      pane?.classList.remove('shape-armed');
    }
    return () => {
      pane?.classList.remove('shape-armed');
    };
  }, [armedShape, isEditMode]);

  // Handle pane click to place node
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!armedShape || !isEditMode) return;

      const shapeDef = shapeDefinitions[armedShape];
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Snap to grid
      const snappedX = Math.round(flowPosition.x / 70) * 70;
      const snappedY = Math.round(flowPosition.y / 25) * 25;

      const newStep: WorkflowStep = {
        id: `step-${Date.now()}`,
        title: `New ${shapeDef.label}`,
        description: '',
        actor: 'madigan-pm' as ActorId,
        phase: 'pre-draw',
        stepType: shapeDef.defaultStepType,
        column: 0,
        shape: armedShape,
      };

      onAddStep(newStep, { x: snappedX, y: snappedY });
      onDisarm();
    },
    [armedShape, isEditMode, screenToFlowPosition, onAddStep, onDisarm]
  );

  if (!armedShape || !isEditMode) return null;

  const shapeDef = shapeDefinitions[armedShape];

  return (
    <>
      {/* Invisible overlay to capture pane clicks */}
      <div
        className="absolute inset-0 z-10"
        onClick={handlePaneClick}
        style={{ cursor: 'crosshair' }}
      />

      {/* Ghost shape preview at cursor */}
      {ghostPos && (
        <div
          className="fixed pointer-events-none z-50 opacity-50"
          style={{
            left: ghostPos.x - shapeDef.width / 4,
            top: ghostPos.y - shapeDef.height / 4,
            width: shapeDef.width / 2,
            height: shapeDef.height / 2,
          }}
        >
          <svg viewBox="0 0 40 30" className="w-full h-full" fill="none">
            <path
              d={shapeDef.iconPath}
              stroke="#3B82F6"
              strokeWidth="1.5"
              fill="#DBEAFE"
              strokeDasharray="4 2"
            />
          </svg>
        </div>
      )}

      {/* Hint bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
        <span>Click to place {shapeDef.label}</span>
        <span className="text-blue-200 text-xs">ESC to cancel</span>
      </div>
    </>
  );
}
