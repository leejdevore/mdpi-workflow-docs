'use client';

import { useCallback, useState } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import type { NodeShape } from '@/types/workflow';
import { basicShapes, specializedShapes, type ShapeDefinition } from './ShapeDefinitions';

interface ShapeToolbarProps {
  armedShape: NodeShape | null;
  onArmShape: (shape: NodeShape | null) => void;
}

function ShapeButton({
  shape,
  isArmed,
  onSelect,
}: {
  shape: ShapeDefinition;
  isArmed: boolean;
  onSelect: (shape: NodeShape) => void;
}) {
  return (
    <button
      onClick={() => onSelect(shape.id)}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
        isArmed
          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
      title={shape.label}
    >
      <svg viewBox="0 0 40 30" className="w-8 h-6" fill="none">
        <path
          d={shape.iconPath}
          stroke={isArmed ? '#3B82F6' : '#64748B'}
          strokeWidth="1.5"
          fill={isArmed ? '#DBEAFE' : '#F8FAFC'}
        />
      </svg>
      <span className={`text-[9px] font-medium leading-none ${isArmed ? 'text-blue-700' : 'text-slate-500'}`}>
        {shape.label}
      </span>
    </button>
  );
}

export function ShapeToolbar({ armedShape, onArmShape }: ShapeToolbarProps) {
  const { isEditMode } = useEditMode();

  const handleSelect = useCallback(
    (shape: NodeShape) => {
      onArmShape(armedShape === shape ? null : shape);
    },
    [armedShape, onArmShape]
  );

  if (!isEditMode) return null;

  return (
    <div className="absolute left-3 top-14 z-20 flex flex-col gap-3 p-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="px-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Basic</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {basicShapes.map((shape) => (
          <ShapeButton
            key={shape.id}
            shape={shape}
            isArmed={armedShape === shape.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="border-t border-slate-100" />

      <div className="px-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Specialized</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {specializedShapes.map((shape) => (
          <ShapeButton
            key={shape.id}
            shape={shape}
            isArmed={armedShape === shape.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
