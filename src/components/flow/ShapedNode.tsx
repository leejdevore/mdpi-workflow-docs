'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import type { WorkflowStep, NodeShape } from '@/data/types';
import { useEditMode } from '@/contexts/EditModeContext';
import { stepTypeColors, getImpactColor, getTotalImpactColor } from '@/styles/flow-theme';

import { DiamondShape } from './shapes/DiamondShape';
import { DocumentShape } from './shapes/DocumentShape';
import { ParallelogramShape } from './shapes/ParallelogramShape';
import { RoundedShape } from './shapes/RoundedShape';
import { TrapezoidShape } from './shapes/TrapezoidShape';
import { SubprocessShape } from './shapes/SubprocessShape';
import { ValidationShape } from './shapes/ValidationShape';

function NodeContent({ data }: { data: WorkflowStep }) {
  const colors = stepTypeColors[data.stepType];
  const impact = data.impact;
  const totalImpact = impact ? impact.consistency + impact.cost + impact.control : null;

  return (
    <div className="w-full">
      <div className="flex items-start gap-2">
        {data.stepNumber != null && (
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold mt-0.5"
            style={{ backgroundColor: colors.badge }}
          >
            {data.stepNumber}
          </span>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-xs font-semibold leading-tight line-clamp-2"
            style={{ color: colors.text }}
          >
            {data.title}
          </span>
          {data.documents && data.documents.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-[10px] text-slate-500 truncate">
                {data.documents[0]}
                {data.documents.length > 1 && ` +${data.documents.length - 1}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {impact && totalImpact != null && (
        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-black/10">
          <div className="flex items-center gap-2">
            <ImpactDot label="C" value={impact.consistency} />
            <ImpactDot label="$" value={impact.cost} />
            <ImpactDot label="Ctrl" value={impact.control} />
          </div>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: 'white',
              backgroundColor: getTotalImpactColor(totalImpact),
            }}
          >
            {totalImpact}
          </span>
        </div>
      )}
    </div>
  );
}

function ImpactDot({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] text-slate-400">{label}</span>
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold"
        style={{ backgroundColor: getImpactColor(value) }}
      >
        {value}
      </span>
    </div>
  );
}

function ShapedNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowStep;
  const { isEditMode } = useEditMode();
  const shape: NodeShape = nodeData.shape ?? 'process';
  const colors = stepTypeColors[nodeData.stepType];

  const handleClass = isEditMode
    ? '!w-3 !h-3 !bg-blue-500 !border-2 !border-white'
    : '!w-2 !h-2 !bg-slate-400';

  const content = <NodeContent data={nodeData} />;

  // Diamond gets 4 handles
  if (shape === 'decision') {
    return (
      <div className="w-full h-full">
        <Handle type="target" position={Position.Left} className={handleClass} />
        <Handle type="target" position={Position.Top} id="top" className={handleClass} />
        <DiamondShape borderColor={colors.border}>{content}</DiamondShape>
        <Handle type="source" position={Position.Right} className={handleClass} />
        <Handle type="source" position={Position.Bottom} id="bottom" className={handleClass} />
      </div>
    );
  }

  const shapeWrapper = (() => {
    switch (shape) {
      case 'document':
        return <DocumentShape bgColor={colors.bg} borderColor={colors.border}>{content}</DocumentShape>;
      case 'data':
        return <ParallelogramShape bgColor={colors.bg} borderColor={colors.border}>{content}</ParallelogramShape>;
      case 'start-end':
        return <RoundedShape bgColor={colors.bg} borderColor={colors.border}>{content}</RoundedShape>;
      case 'manual-operation':
        return <TrapezoidShape bgColor={colors.bg} borderColor={colors.border}>{content}</TrapezoidShape>;
      case 'subprocess':
        return <SubprocessShape bgColor={colors.bg} borderColor={colors.border}>{content}</SubprocessShape>;
      case 'validation':
        return <ValidationShape bgColor={colors.bg} borderColor={colors.border}>{content}</ValidationShape>;
      default:
        // 'process' — standard rectangle (same as ProcessNode)
        return (
          <div
            className="rounded-lg border-2 shadow-sm px-3 py-2 cursor-pointer transition-shadow hover:shadow-md w-full h-full"
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          >
            {content}
          </div>
        );
    }
  })();

  return (
    <div className="w-full h-full">
      <Handle type="target" position={Position.Left} className={handleClass} />
      {shapeWrapper}
      <Handle type="source" position={Position.Right} className={handleClass} />
    </div>
  );
}

export const ShapedNode = memo(ShapedNodeComponent);
