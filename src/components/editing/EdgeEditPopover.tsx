'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { Edge } from '@xyflow/react';

interface EdgeEditPopoverProps {
  edge: Edge;
  position: { x: number; y: number };
  onSave: (edgeId: string, updates: Partial<Edge>) => void;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

export function EdgeEditPopover({ edge, position, onSave, onDelete, onClose }: EdgeEditPopoverProps) {
  const [label, setLabel] = useState((edge.label as string) ?? '');
  const [animated, setAnimated] = useState(edge.animated ?? false);
  const [edgeType, setEdgeType] = useState<'default' | 'conditional'>(
    (edge.style as Record<string, string>)?.stroke === '#F59E0B' ? 'conditional' : 'default'
  );
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleSave = useCallback(() => {
    onSave(edge.id, {
      label: label.trim() || undefined,
      animated,
      style: {
        stroke: edgeType === 'conditional' ? '#F59E0B' : '#64748B',
        strokeWidth: 2,
      },
    });
    onClose();
  }, [edge.id, label, animated, edgeType, onSave, onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-56"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Edge label..."
            className="w-full text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Type</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEdgeType('default')}
              className={`flex-1 text-xs py-1 px-2 rounded border transition-colors ${
                edgeType === 'default'
                  ? 'bg-slate-100 border-slate-400 text-slate-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => setEdgeType('conditional')}
              className={`flex-1 text-xs py-1 px-2 rounded border transition-colors ${
                edgeType === 'conditional'
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              Conditional
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={animated}
            onChange={(e) => setAnimated(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-xs text-slate-600">Animated</span>
        </label>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onDelete(edge.id);
              onClose();
            }}
            className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete edge"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
