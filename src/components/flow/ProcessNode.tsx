'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import type { ProcessNodeData } from '@/hooks/useWorkflowData';
import { useEditMode } from '@/contexts/EditModeContext';
import { stepTypeColors, getImpactColor, getTotalImpactColor } from '@/styles/flow-theme';

function ProcessNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as ProcessNodeData;
  const { isEditMode } = useEditMode();
  const colors = stepTypeColors[nodeData.stepType];
  const impact = nodeData.impact;
  const totalImpact = impact ? impact.consistency + impact.cost + impact.control : null;

  return (
    <div
      className="rounded-lg border-2 shadow-sm px-3 py-2 cursor-pointer transition-shadow hover:shadow-md"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        width: '100%',
        height: '100%',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={isEditMode ? '!w-3 !h-3 !bg-blue-500 !border-2 !border-white' : '!w-2 !h-2 !bg-slate-400'}
      />

      <div className="flex items-start gap-2">
        {nodeData.stepNumber != null && (
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold mt-0.5"
            style={{ backgroundColor: colors.badge }}
          >
            {nodeData.stepNumber}
          </span>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-xs font-semibold leading-tight line-clamp-2"
            style={{ color: colors.text }}
          >
            {nodeData.title}
          </span>
          {nodeData.documents && nodeData.documents.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-[10px] text-slate-500 truncate">
                {nodeData.documents[0]}
                {nodeData.documents.length > 1 && ` +${nodeData.documents.length - 1}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Impact scores row */}
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

      <Handle
        type="source"
        position={Position.Right}
        className={isEditMode ? '!w-3 !h-3 !bg-blue-500 !border-2 !border-white' : '!w-2 !h-2 !bg-slate-400'}
      />
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

export const ProcessNode = memo(ProcessNodeComponent);
