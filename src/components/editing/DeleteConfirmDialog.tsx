'use client';

import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  name: string;
  connectedEdgeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  name,
  connectedEdgeCount,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-96">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Delete &ldquo;{name}&rdquo;?</h3>
            <p className="text-sm text-slate-500 mt-1">
              This action cannot be undone.
              {connectedEdgeCount > 0 && (
                <> {connectedEdgeCount} connected edge{connectedEdgeCount > 1 ? 's' : ''} will also be removed.</>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
