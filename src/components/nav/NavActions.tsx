'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { NavNewWorkflowDialog } from './NavNewWorkflowDialog';

export function NavActions() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="border-t border-slate-100 p-3">
      <button
        onClick={() => setShowDialog(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Workflow
      </button>

      {showDialog && (
        <NavNewWorkflowDialog onClose={() => setShowDialog(false)} />
      )}
    </div>
  );
}
