'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { NavScenarioItem } from './NavScenarioItem';
import type { NavTreeWorkflow } from '@/types/workflow';

interface NavWorkflowItemProps {
  workflow: NavTreeWorkflow;
}

export function NavWorkflowItem({ workflow }: NavWorkflowItemProps) {
  const { selection, removeWorkflow } = useWorkflowContext();
  const [expanded, setExpanded] = useState(true);
  const isActive = selection?.workflowId === workflow.id;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete workflow "${workflow.name}" and all its scenarios?`)) {
      await removeWorkflow(workflow.id);
    }
  };

  return (
    <div>
      {/* Workflow header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={`w-full flex items-center gap-1.5 px-3 py-2 text-left group hover:bg-slate-50 transition-colors ${
          isActive ? 'bg-slate-50' : ''
        }`}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
        <span className="text-sm font-medium text-slate-800 truncate flex-1">
          {workflow.name}
        </span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
          title="Delete workflow"
        >
          <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
        </button>
      </button>

      {/* Scenarios */}
      {expanded && workflow.scenarios.length > 0 && (
        <div className="ml-3">
          {workflow.scenarios.map((scenario) => (
            <NavScenarioItem
              key={scenario.id}
              scenario={scenario}
              workflowId={workflow.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
