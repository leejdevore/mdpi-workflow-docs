'use client';

import { Legend } from './Legend';
import { WorkflowSelector } from './WorkflowSelector';
import type { ManagedWorkflow } from '@/hooks/useWorkflowManager';

interface HeaderProps {
  title: string;
  subtitle?: string;
  workflows?: ManagedWorkflow[];
  activeWorkflowId?: string;
  onSwitchWorkflow?: (id: string) => void;
  onCreateWorkflow?: (name: string, description?: string) => void;
  onDeleteWorkflow?: (id: string) => void;
}

export function Header({
  title,
  subtitle,
  workflows,
  activeWorkflowId,
  onSwitchWorkflow,
  onCreateWorkflow,
  onDeleteWorkflow,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {workflows && activeWorkflowId && onSwitchWorkflow && onCreateWorkflow && onDeleteWorkflow && (
          <WorkflowSelector
            workflows={workflows}
            activeWorkflowId={activeWorkflowId}
            onSwitch={onSwitchWorkflow}
            onCreate={onCreateWorkflow}
            onDelete={onDeleteWorkflow}
          />
        )}
      </div>
      <Legend />
    </header>
  );
}
