'use client';

import { Pencil, Check, Undo2, Redo2 } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';

interface EditModeToggleProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function EditModeToggle({ canUndo, canRedo, onUndo, onRedo }: EditModeToggleProps) {
  const { isEditMode, toggleEditMode, canEdit } = useEditMode();

  if (!canEdit) return null;

  return (
    <div className="flex items-center gap-1">
      {isEditMode && (
        <>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
        </>
      )}
      <button
        onClick={toggleEditMode}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isEditMode
            ? 'bg-amber-100 text-amber-800 border border-amber-300'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
        }`}
        title={isEditMode ? 'Finish editing' : 'Switch to edit mode'}
      >
        {isEditMode ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Done
          </>
        ) : (
          <>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </>
        )}
      </button>
    </div>
  );
}
