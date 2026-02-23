'use client';

import { useState, useCallback } from 'react';
import type { ViewId, WorkflowView } from '@/data/types';
import { getWorkflowView, getAllViewIds } from '@/data';

export interface ManagedWorkflow {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  /** Only for default workflows — maps to ViewId */
  viewId?: ViewId;
}

function getDefaultWorkflows(): ManagedWorkflow[] {
  return getAllViewIds().map((viewId) => {
    const view = getWorkflowView(viewId);
    return {
      id: viewId,
      name: view.label,
      description: view.description,
      isDefault: true,
      viewId,
    };
  });
}

export function useWorkflowManager() {
  const [workflows, setWorkflows] = useState<ManagedWorkflow[]>(getDefaultWorkflows);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('current');

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) ?? workflows[0];

  const createWorkflow = useCallback(
    (name: string, description = '') => {
      const id = `custom-${Date.now()}`;
      const newWorkflow: ManagedWorkflow = {
        id,
        name,
        description,
        isDefault: false,
      };
      setWorkflows((prev) => [...prev, newWorkflow]);
      setActiveWorkflowId(id);
      return id;
    },
    []
  );

  const deleteWorkflow = useCallback(
    (id: string) => {
      // Only delete user-created workflows
      setWorkflows((prev) => {
        const wf = prev.find((w) => w.id === id);
        if (!wf || wf.isDefault) return prev;
        const updated = prev.filter((w) => w.id !== id);
        // If we deleted the active workflow, switch to the first one
        if (id === activeWorkflowId && updated.length > 0) {
          setActiveWorkflowId(updated[0].id);
        }
        return updated;
      });
    },
    [activeWorkflowId]
  );

  const switchWorkflow = useCallback((id: string) => {
    setActiveWorkflowId(id);
  }, []);

  // For default workflows, the viewId is the same as the id
  // For custom workflows, we'll use 'current' as a fallback for now (empty canvas coming later with persistence)
  const activeViewId: ViewId = (activeWorkflow?.viewId ?? 'current') as ViewId;

  return {
    workflows,
    activeWorkflow,
    activeWorkflowId,
    activeViewId,
    createWorkflow,
    deleteWorkflow,
    switchWorkflow,
  };
}
