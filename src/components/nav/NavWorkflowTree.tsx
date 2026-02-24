'use client';

import { useWorkflowContext } from '@/contexts/WorkflowContext';
import { NavWorkflowItem } from './NavWorkflowItem';

export function NavWorkflowTree() {
  const { tree, treeLoading } = useWorkflowContext();

  if (treeLoading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="ml-4 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-400">
        No workflows yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((workflow) => (
        <NavWorkflowItem key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}
