'use client';

import { useState } from 'react';
import { Plus, Users, Columns3, FileDown } from 'lucide-react';
import { NavNewWorkflowDialog } from './NavNewWorkflowDialog';
import { ActorManagementPanel } from './ActorManagementPanel';
import { PhaseManagementPanel } from './PhaseManagementPanel';
import { ExportPanel } from './ExportPanel';
import { useWorkflowContext } from '@/contexts/WorkflowContext';

export function NavActions() {
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showActorPanel, setShowActorPanel] = useState(false);
  const [showPhasePanel, setShowPhasePanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const { activeWorkflow } = useWorkflowContext();

  return (
    <div className="border-t border-slate-100 p-3 space-y-1">
      {activeWorkflow && (
        <>
          <button
            onClick={() => setShowActorPanel(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <Users className="w-4 h-4" />
            Manage Lanes
          </button>
          <button
            onClick={() => setShowPhasePanel(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <Columns3 className="w-4 h-4" />
            Manage Phases
          </button>
          <button
            onClick={() => setShowExportPanel(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Export to Markdown
          </button>
        </>
      )}

      <button
        onClick={() => setShowNewWorkflow(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Workflow
      </button>

      {showNewWorkflow && (
        <NavNewWorkflowDialog onClose={() => setShowNewWorkflow(false)} />
      )}

      {showActorPanel && (
        <ActorManagementPanel onClose={() => setShowActorPanel(false)} />
      )}

      {showPhasePanel && (
        <PhaseManagementPanel onClose={() => setShowPhasePanel(false)} />
      )}

      {showExportPanel && (
        <ExportPanel onClose={() => setShowExportPanel(false)} />
      )}
    </div>
  );
}
